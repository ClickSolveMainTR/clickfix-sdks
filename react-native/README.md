# @getclickfix/react-native

ClickFix customer support in a bare React Native app: a provider, hooks for
everything the web widget does (identity, conversations, messages, files,
typing, read receipts, realtime, help search, rating) and optional screens.
Built on [`@getclickfix/visitor-core`](../visitor-core/README.md) in **app
mode**: requests carry your mobile app key and package name instead of a page
origin. No DOM, no `window`; ESM compiled for Hermes; peers are only `react`
and `react-native` (`react-native-keychain` optional).

Using Expo? Take [`@getclickfix/expo`](../expo/README.md): it wraps this
package and wires `expo-secure-store`, `expo-file-system`, `expo-linking` and
`expo-constants` for you.

```sh
npm install @getclickfix/react-native
# optional, for the token in the Keychain/Keystore:
npm install react-native-keychain
```

Changes: [CHANGELOG.md](./CHANGELOG.md). Full walkthrough:
https://getclickfix.com/docs/integration-guide.

## Compatibility

| Package | React Native | React | Notes |
|---|---|---|---|
| 0.1.x | 0.81 and newer (tested with 0.88) | 18.2 / 19 | New Architecture and Hermes; Expo SDK 54–58 through `@getclickfix/expo` |

## Setup

1. In the ClickFix panel create a **mobile app key**: Web widget → Advanced →
   Mobile apps (platform, package name, key). The key is a public identifier
   bound to your bundle id / application id; the API rejects it when it
   arrives with an `Origin`, so it is useless from a page.
2. Compute `user_hash` **on your server** with the widget's identity secret
   (Web widget → Security): `hex(HMAC-SHA256(secret, user_id))`, or with a
   company `hex(HMAC-SHA256(secret, user_id + "\n" + company_id))`. Never
   ship the secret in the app. `@getclickfix/node` has `identityHash`; the
   same formula is in Go, PHP and curl in the integration guide.
3. Wrap the app:

```tsx
import { ClickFixProvider, keychainStorage } from '@getclickfix/react-native';
import * as Keychain from 'react-native-keychain';

export default function App() {
  return (
    <ClickFixProvider
      appKey="cf_app_…"
      packageName="com.example.shop"            // as registered with the key
      widgetId="WIDGET_ID"
      baseUrl="https://support.example.com"     // your ClickFix app
      storage={keychainStorage(Keychain)}        // default: memory
      getUserHash={(userId, companyId) => api.supportSession(userId, companyId)} // your server
      language="tr"
    >
      <Root />
    </ClickFixProvider>
  );
}
```

The provider bootstraps the visitor session on mount (`autoInit`), restores
the token from `storage`, renews an expired token transparently and follows
the visitor's realtime channel over React Native's `WebSocket` when the
widget enables it. When the app returns to the foreground it reconnects and
refreshes.

## Hooks

```tsx
const { status, error, connected, init } = useClickFix();
```

`status` is `idle | loading | ready | error`; `connected` is the realtime
socket (hooks poll while it is down).

### useVisitor

```tsx
const visitor = useVisitor();
await visitor.identify({ userId: '1001', name: 'Ayşe', email: 'ayse@example.com', company: { id: 'F-77', name: 'Örnek A.Ş.' } });
// userHash omitted → the provider's getUserHash('1001', 'F-77'); or pass userHash yourself.
visitor.verified;                       // true after a valid user_hash
visitor.visitor?.company_verified;     // the company id was signed too (CF-206)
await visitor.setAttributes({ plan: 'pro', seats: 3 });   // custom fields
await visitor.updateProfile({ phone: '+90…' });
visitor.setScreen('orders/42');        // page_url of the next message
visitor.track('viewed_order', { id: 42 });  // the next message carries the last 20 events
await visitor.reset();                 // logout: a stranger's session
```

### useConversations

```tsx
const { items, loading, error, reload, create } = useConversations();
const sent = await create('Merhaba');              // or create({ text, form, consent }, file)
```

Starts from the bootstrap list, refreshes on `message.created` /
`conversation.updated` pushes and on foreground.

### useConversation

```tsx
const chat = useConversation(uuid /* or null for a new one */, { pollMs: 4000 });
chat.messages;              // oldest first; chat.hasMore + chat.loadMore() for history
await chat.send('Teşekkürler');
await chat.send({ text: 'Ekte' }, { uri, name: 'photo.jpg', type: 'image/jpeg' });
chat.setTyping(true);       // rate-limited; setTyping(false) when the input empties
chat.markRead();            // read receipts for agent replies
chat.agentTyping;           // from the realtime channel (clears after 8 s)
chat.uuid;                  // set after the first send of a new conversation
```

### useHelpSearch and useRating

```tsx
const { result, loading } = useHelpSearch(query, 'tr', { debounceMs: 300 });
const { submit, rating } = useRating(uuid);  // submit(5, 'great') when conversation.can_rate
```

## Deep links

`parseConversationLink(url)` reads `?conversation=<id>`,
`/conversation/<id>`, `/conversations/<id>` and Expo Go's `/--/` prefix.
`useDeepLinkConversation()` returns the conversation of the initial URL or a
URL received while running; call `clear()` after navigating.

## Screens (`@getclickfix/react-native/ui`)

```tsx
import { ConversationListScreen, ChatScreen, ClickFixThemeProvider, darkTheme, labelsTr } from '@getclickfix/react-native/ui';

<ClickFixThemeProvider theme={darkTheme} labels={labelsTr}>
  <ConversationListScreen onOpen={(c) => navigate('chat', { uuid: c.uuid })} onNew={() => navigate('chat', { uuid: null })} />
  <ChatScreen conversation={uuid} onCreated={(id) => replace('chat', { uuid: id })} pickFile={pickImage} requireConsent />
</ClickFixThemeProvider>
```

- `ConversationListScreen`: pull to refresh, unread badges, resolved marker.
- `ChatScreen`: bubbles (visitor right, agent left), attachments, typing
  indicator, read receipts while open, `loadMore` on scroll, the widget's
  **start form** before the first message of a new conversation
  (`startForm={false}` to skip), the **rating** row when the conversation can
  be rated, `renderMessage` to replace a bubble.
- `PreChatForm`: the start form on its own (`fieldVisible`, `missingFields`
  mirror the widget's conditions and validation).
- Theme: `ClickFixTheme` (colors, radius, spacing, font) and
  `ClickFixLabels` (EN default, `labelsTr`), per screen via props or app-wide
  via `ClickFixThemeProvider`. Pure `StyleSheet`, no extra dependency; the
  defaults follow the web widget's look.

`pickFile` is yours: return `{ uri, name, type }` from an image/document
picker, or `null` when cancelled (`@getclickfix/expo` ships `pickAttachment`).

## Bare React Native vs Expo

| | `@getclickfix/react-native` | `@getclickfix/expo` |
|---|---|---|
| Token storage | `memoryStorage()` default, `keychainStorage(Keychain)` | `expo-secure-store` |
| Package name | `packageName` prop | from `app.json` (`ios.bundleIdentifier` / `android.package`) |
| Files | any `{ uri, name, type }` | `fileAttachment(uri)`, `pickAttachment()` |
| Deep links | `useDeepLinkConversation()` (RN `Linking`) | `useExpoDeepLinkConversation()`, `conversationURL()` |

## Testing

`pnpm test:native` in `sdks/` runs the hooks and screens under jest with
the React Native preset and a fake widget API (`tests/stub.ts`); the Node
test runner checks the published files (no DOM, metadata).

## Türkçe özet

Bare React Native için ClickFix: `ClickFixProvider` (uygulama anahtarı +
paket adı, `getUserHash` ile sunucudan `user_hash`, `SecureStorage` ile
belirteç), `useVisitor` / `useConversations` / `useConversation` /
`useHelpSearch` / `useRating` hook'ları, derin bağlantı yardımcıları ve
`@getclickfix/react-native/ui` altında temalanabilir konuşma listesi, sohbet
ve ön form ekranları. `user_hash` yalnız sunucuda üretilir; Expo
kullanıyorsanız `@getclickfix/expo` paketini kullanın.
