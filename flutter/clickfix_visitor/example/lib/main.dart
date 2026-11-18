// Example: a native support chat on the ClickFix visitor API. The session
// starts with the mobile app key, the signed-in user is identified with a
// user_hash from your server (stubbed here) and replies arrive by polling.

import 'dart:async';

import 'package:clickfix_visitor/clickfix_visitor.dart';
import 'package:flutter/material.dart';

const String baseUrl = String.fromEnvironment(
  'CLICKFIX_BASE_URL',
  defaultValue: 'https://support.example.com/api',
);
const String widgetId = String.fromEnvironment(
  'CLICKFIX_WIDGET_ID',
  defaultValue: 'WIDGET_ID',
);
const String appKey = String.fromEnvironment(
  'CLICKFIX_APP_KEY',
  defaultValue: 'APP_KEY',
);
const String appPackage = String.fromEnvironment(
  'CLICKFIX_APP_PACKAGE',
  defaultValue: 'com.example.app',
);

void main() => runApp(const ExampleApp());

class ExampleApp extends StatelessWidget {
  const ExampleApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'ClickFix native example',
    theme: ThemeData(colorSchemeSeed: Colors.indigo),
    home: const SupportScreen(),
  );
}

/// What your backend returns for the signed-in user: the HMAC is computed
/// server side with the widget's identity secret. Never ship the secret.
Future<WidgetIdentifyInput> fakeSupportSession() async {
  await Future<void>.delayed(const Duration(milliseconds: 200));
  // Replace with: GET https://api.yourapp.com/support-session (authenticated).
  return const WidgetIdentifyInput(
    userId: '1001',
    userHash: 'REPLACE_WITH_SERVER_COMPUTED_HMAC',
    name: 'Ada Demir',
  );
}

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  // One client per visitor. Persist `token` (onToken) in secure storage and
  // pass it back here to resume the session on the next start.
  final ClickFixVisitor client = ClickFixVisitor(
    publicId: widgetId,
    baseUrl: baseUrl,
    app: const ClickFixApp(key: appKey, packageName: appPackage),
    screen: 'support',
    language: 'tr',
    onToken: (token) =>
        debugPrint('persist the visitor token (${token.length} chars)'),
  );
  final TextEditingController input = TextEditingController();
  final List<WidgetMessage> messages = [];
  MessagePoller? poller;
  StreamSubscription<WidgetMessage>? subscription;
  String? conversation;
  String status = 'Connecting…';

  @override
  void initState() {
    super.initState();
    unawaited(_start());
  }

  Future<void> _start() async {
    try {
      final boot = await client.init();
      try {
        await client.identify(await fakeSupportSession());
      } on ClickFixApiException catch (e) {
        // WIDGET_IDENTITY_INVALID etc.: the visitor stays anonymous.
        debugPrint('identify failed: ${e.code}');
      }
      final open = boot.conversations.where((c) => c.open).toList();
      if (open.isNotEmpty) await _open(open.first.uuid);
      setState(() => status = boot.widget.online ? 'Online' : 'Offline');
    } on Exception catch (e) {
      setState(() => status = 'Could not connect: $e');
    }
  }

  Future<void> _open(String uuid) async {
    await subscription?.cancel();
    await poller?.close();
    messages.clear();
    conversation = uuid;
    final next = client.poll(uuid, interval: const Duration(seconds: 4));
    subscription = next.messages.listen(
      (m) => setState(() => messages.add(m)),
      onError: (Object e) => debugPrint('poll failed: $e'),
    );
    poller = next..start();
    unawaited(client.markRead(uuid).then((_) {}, onError: (Object _) {}));
  }

  Future<void> _send() async {
    final text = input.text.trim();
    if (text.isEmpty) return;
    input.clear();
    client.track('support_message_sent');
    final current = conversation;
    try {
      if (current == null) {
        final sent = await client.createConversation(
          WidgetSendInput(text: text),
        );
        await _open(sent.conversationUuid);
      } else {
        await client.sendMessage(current, WidgetSendInput(text: text));
        await poller?.pollNow();
      }
    } on ClickFixApiException catch (e) {
      if (e.status == 409) {
        // The conversation was closed: start a new one with this message.
        conversation = null;
        input.text = text;
        return _send();
      }
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Not sent: ${e.code}')));
      }
    }
  }

  @override
  void dispose() {
    unawaited(subscription?.cancel());
    unawaited(poller?.close());
    unawaited(client.close());
    input.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Support'),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(20),
        child: Text(status),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.add_comment_outlined),
          tooltip: 'New conversation',
          onPressed: () => setState(() {
            conversation = null;
            messages.clear();
          }),
        ),
      ],
    ),
    body: Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: messages.length,
            itemBuilder: (context, i) {
              final m = messages[i];
              final mine = m.direction == 'in';
              return Align(
                alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(10),
                    child: Text(
                      mine ? m.content : '${m.senderName}: ${m.content}',
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        SafeArea(
          child: Row(
            children: [
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: TextField(
                    controller: input,
                    decoration: const InputDecoration(hintText: 'Message'),
                    onSubmitted: (_) => _send(),
                  ),
                ),
              ),
              IconButton(icon: const Icon(Icons.send), onPressed: _send),
            ],
          ),
        ),
      ],
    ),
  );
}
