# @getclickfix/expo

ClickFix customer support in an Expo app (SDK 54+, built against 58) in one
line. Wraps [`@getclickfix/react-native`](../react-native/README.md) and
re-exports all of it, adding the Expo adapters:

| Need | Expo module | What you get |
|---|---|---|
| Visitor token between launches | `expo-secure-store` | `ClickFixExpoProvider` stores it; `secureStoreStorage()` on its own |
| Attachments | `expo-file-system` | `fileAttachment(uri)`, `pickAttachment()` (system picker) |
| Open a conversation from a link / push | `expo-linking` | `useExpoDeepLinkConversation()`, `conversationURL(uuid)` |
| App identity | `expo-constants` | package name from `app.json`, `appVersion()`, `isExpoGo()` |

```sh
npx expo install @getclickfix/expo expo-secure-store expo-file-system expo-linking expo-constants
```

Changes: [CHANGELOG.md](./CHANGELOG.md). Guide:
https://getclickfix.com/docs/integration-guide/expo. Example app:
[`clickfix-examples/expo`](https://github.com/ClickSolveMainTR/clickfix-examples/tree/main/expo).

## Compatibility

| Package | Expo SDK | React Native | Notes |
|---|---|---|---|
| 0.1.x, 0.2.x | 54 – 58 (built with 58) | 0.81 – 0.88 | `expo-file-system` `File` API (SDK 54+); New Architecture |

## Setup

```tsx
import { ClickFixExpoProvider } from '@getclickfix/expo';

export default function App() {
  return (
    <ClickFixExpoProvider
      appKey="cf_app_…"                         // Web widget → Advanced → Mobile apps
      widgetId="WIDGET_ID"
      baseUrl="https://support.example.com"
      getUserHash={(userId, companyId) => api.supportSession(userId, companyId)}  // your server
    >
      <Root />
    </ClickFixExpoProvider>
  );
}
```

The package name the app key is bound to comes from `app.json`
(`ios.bundleIdentifier` / `android.package`). `user_hash` is computed on your
server (`hex(HMAC-SHA256(secret, user_id))`, with a company
`user_id + "\n" + company_id`); the identity secret never ships in the app.

Then the hooks and screens of `@getclickfix/react-native`:

```tsx
import { useVisitor, useConversation, pickAttachment, useExpoDeepLinkConversation } from '@getclickfix/expo';
import { ChatScreen, ConversationListScreen } from '@getclickfix/react-native/ui';

await useVisitor().identify({ userId: '1001', company: { id: 'F-77' } });
<ChatScreen conversation={uuid} pickFile={() => pickAttachment({ mimeTypes: ['image/*', 'application/pdf'], maxBytes: 10 * 1024 * 1024 })} />;
const link = useExpoDeepLinkConversation();   // myapp://conversation/<uuid>
```

## Expo Go vs development build

| Works in Expo Go | Needs a development build (`npx expo run:ios` / `eas build`) |
|---|---|
| Everything in this package: SecureStore, file system picker, linking, constants, realtime, the screens | Nothing in this package. Only if you add native modules of your own (e.g. `react-native-keychain`, push notifications) |

One Expo Go caveat: the running bundle id is Expo Go's, not yours, so
`appPackageName()` returns null there. Create a **development app key** in
the panel for a name of your choice (e.g. `com.example.shop.dev`) and pass
`packageName="com.example.shop.dev"` while in Expo Go; production builds use
the key bound to the real bundle id. `isExpoGo()` tells the two apart.

## Deep links

`conversationURL(uuid)` builds `myapp://conversation/<uuid>` with your
`scheme` (or the `exp://…/--/conversation/<uuid>` form while developing),
for push payloads and e-mails. `useExpoDeepLinkConversation()` follows
`expo-linking`'s `useURL()` and returns the conversation id; call `clear()`
after navigating.
