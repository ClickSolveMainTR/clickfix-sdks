import 'dart:async';

import 'client.dart';
import 'generated/models.dart';

/// Polls a conversation for new messages (`GET .../messages?after=`).
///
/// Listen to [messages], then [start]. Errors are reported on the stream
/// and back off exponentially up to [maxInterval]; the next success resets
/// the delay. Without an [after] cursor the first poll delivers the
/// conversation's first page.
class MessagePoller {
  /// A poller of [conversation]; usually created with [ClickFixVisitor.poll].
  MessagePoller(
    this.client,
    this.conversation, {
    this.interval = const Duration(seconds: 5),
    this.maxInterval = const Duration(minutes: 1),
    String? after,
    Future<void> Function(Duration)? delay,
  }) : _after = after,
       _delay = delay ?? Future<void>.delayed;

  /// Client the requests go through.
  final ClickFixVisitor client;

  /// Conversation uuid.
  final String conversation;

  /// Delay between polls.
  final Duration interval;

  /// Upper bound of the delay after errors.
  final Duration maxInterval;

  final Future<void> Function(Duration) _delay;
  final _controller = StreamController<WidgetMessage>.broadcast();
  String? _after;
  bool _running = false;
  int _failures = 0;

  /// New messages, oldest first.
  Stream<WidgetMessage> get messages => _controller.stream;

  /// Uuid of the newest message delivered so far.
  String? get after => _after;

  /// Whether [start] was called and [stop] was not.
  bool get running => _running;

  /// Fetches new messages once (all pages while `has_more`) and adds them
  /// to [messages]; returns them.
  Future<List<WidgetMessage>> pollNow() async {
    final out = <WidgetMessage>[];
    for (var page = 0; page < 20; page++) {
      final res = await client.messages(conversation, after: _after);
      out.addAll(res.items);
      if (res.items.isNotEmpty) _after = res.items.last.uuid;
      for (final m in res.items) {
        if (!_controller.isClosed) _controller.add(m);
      }
      if (!res.hasMore || res.items.isEmpty) break;
    }
    return out;
  }

  /// Starts polling until [stop].
  void start() {
    if (_running) return;
    _running = true;
    unawaited(_loop());
  }

  Future<void> _loop() async {
    while (_running) {
      try {
        await pollNow();
        _failures = 0;
      } on Object catch (e, st) {
        _failures++;
        if (!_controller.isClosed) _controller.addError(e, st);
      }
      if (!_running) break;
      await _delay(_wait());
    }
  }

  Duration _wait() {
    if (_failures == 0) return interval;
    final ms = interval.inMilliseconds * (1 << (_failures.clamp(1, 10)));
    return ms > maxInterval.inMilliseconds
        ? maxInterval
        : Duration(milliseconds: ms);
  }

  /// Stops polling (a request in flight still completes).
  void stop() => _running = false;

  /// Stops polling and closes [messages].
  Future<void> close() async {
    stop();
    await _controller.close();
  }
}
