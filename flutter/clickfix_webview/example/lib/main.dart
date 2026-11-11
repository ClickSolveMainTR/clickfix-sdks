// Example: hand the signed-in user to the ClickFix widget and open a
// conversation. The identity hash comes from your server (stubbed here).

import 'package:clickfix_webview/clickfix_webview.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

const String widgetId = String.fromEnvironment(
  'CLICKFIX_WIDGET_ID',
  defaultValue: 'WIDGET_ID',
);
const String origin = String.fromEnvironment(
  'CLICKFIX_ORIGIN',
  defaultValue: defaultClickFixOrigin,
);
const String conversationToOpen = String.fromEnvironment(
  'CLICKFIX_CONVERSATION',
);

void main() => runApp(const ExampleApp());

class ExampleApp extends StatelessWidget {
  const ExampleApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'ClickFix example',
    theme: ThemeData(colorSchemeSeed: Colors.indigo),
    home: const HomeScreen(),
  );
}

/// What your backend returns for the signed-in user: the HMAC is computed
/// server side with the widget's identity secret. Never ship the secret.
class SupportSession {
  const SupportSession({
    required this.userId,
    required this.userHash,
    this.name,
    this.companyId,
  });

  final String userId;
  final String userHash;
  final String? name;
  final String? companyId;
}

Future<SupportSession> fakeSupportSession() async {
  await Future<void>.delayed(const Duration(milliseconds: 200));
  // Replace with: GET https://api.yourapp.com/support-session (authenticated).
  return const SupportSession(
    userId: '1001',
    userHash: 'REPLACE_WITH_SERVER_COMPUTED_HMAC',
    name: 'Ayşe Yılmaz',
    companyId: 'F-77',
  );
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int unread = 0;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('My app')),
    body: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Widget: $widgetId\nOrigin: $origin',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            icon: Badge.count(
              count: unread,
              isLabelVisible: unread > 0,
              child: const Icon(Icons.support_agent),
            ),
            label: const Text('Support'),
            onPressed: () async {
              final result = await Navigator.of(context).push<int>(
                MaterialPageRoute(
                  builder: (_) => SupportScreen(
                    conversation: conversationToOpen.isEmpty
                        ? null
                        : conversationToOpen,
                  ),
                ),
              );
              if (result != null) setState(() => unread = result);
            },
          ),
        ],
      ),
    ),
  );
}

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key, this.conversation});

  /// Conversation to open on load (deep link from a push notification).
  final String? conversation;

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  late final ClickFixController controller = ClickFixController(
    widgetId: widgetId,
    origin: origin,
    locale: 'tr',
    theme: ClickFixTheme.auto,
    conversation: widget.conversation,
    // Set only after your app really collected consent.
    consent: true,
    onRejectedMessage: (code) => debugPrint('clickfix: dropped message $code'),
  );
  int unread = 0;
  String? error;

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  Future<void> _onReady(ClickFixReady ready) async {
    try {
      final s = await fakeSupportSession();
      await controller.identify(
        ClickFixIdentity(
          userId: s.userId,
          userHash: s.userHash,
          name: s.name,
          company: ClickFixCompany(id: s.companyId),
        ),
      );
      await controller.track('app_screen', properties: {'screen': 'support'});
    } on ClickFixBridgeError catch (e) {
      // WIDGET_IDENTITY_INVALID etc.: the visitor stays anonymous.
      if (mounted) setState(() => error = e.code);
    }
  }

  Future<void> _onLink(ClickFixLink link) async {
    // Already validated (https only); open outside the app.
    await launchUrl(link.url, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Support'),
      actions: [
        IconButton(
          icon: const Icon(Icons.add_comment_outlined),
          tooltip: 'New conversation',
          onPressed: () => controller.open(view: ClickFixView.newConversation),
        ),
        IconButton(
          icon: const Icon(Icons.logout),
          tooltip: 'Forget visitor',
          onPressed: () => controller.reset(),
        ),
      ],
      bottom: error == null
          ? null
          : PreferredSize(
              preferredSize: const Size.fromHeight(24),
              child: Text('identify failed: $error'),
            ),
    ),
    body: ClickFixWebView(
      controller: controller,
      onReady: _onReady,
      onLink: _onLink,
      onUnread: (count) => unread = count,
      onClose: () => Navigator.of(context).pop(unread),
    ),
  );
}
