# @getclickfix/react-widget

UI-free, typed, tree-shakable React 18+ hooks around the existing visitor API.
The transport is [`@getclickfix/visitor-core`](../visitor-core/README.md) in browser
mode (the page origin is the credential); no other runtime dependency besides the React peer.

```sh
npm install @getclickfix/react-widget
```

Full walkthrough: https://getclickfix.com/docs/integration-guide. Changes: [CHANGELOG.md](./CHANGELOG.md). Develop from `sdks` with `pnpm build`.

```tsx
'use client';
import { useEffect, useState } from 'react';
import { createWidgetClient, useWidget, useMessages, useTyping } from '@getclickfix/react-widget';

export function Support() {
  const [client] = useState(() => createWidgetClient({
    publicId: 'your-widget-public-uuid',
    appOrigin: 'https://getclickfix.com', // the ClickFix app; or baseURL: '/api' behind your own same-origin proxy
    onToken: token => sessionStorage.setItem('support-token', token),
  }));
  const { visitor } = useWidget(client);
  useEffect(() => {
    const abort = new AbortController();
    void client.init(abort.signal).catch(console.error);
    return () => abort.abort();
  }, [client]);
  // Render your own components. Fetch conversations after init completes.
  return <span>{visitor ? 'Ready' : 'Connecting'}</span>;
}
```

`appOrigin` sends requests to `<appOrigin>/api/v1/widget/...` across origins (CORS, cookies
are never sent); add your site to the widget's **allowed domains**. Use `baseURL` instead
when a same-origin proxy of the widget API serves your page (the default is `/api`).

Initialize after your application's consent step. Keep one stable client per widget
and authenticated user. Optional `token` resumes a saved session; `onToken` lets your
application choose its own storage policy. `reset()` clears the in-memory identity
and calls `onToken('')`; clear persisted tokens on logout. Nothing is stored globally.

```ts
await client.identify({ user_id: user.id, user_hash: serverProvidedHmac });
const { items } = await client.conversations();
const page = await client.messages(items[0].uuid, { before: oldestMessageUUID });
await client.createConversation({ text: 'Hello', client_id: crypto.randomUUID() });
await client.sendMessage(conversationUUID,
  { text: 'Photo', client_id: stableMessageUUID }, file);
await client.typing(conversationUUID, true);
await client.markRead(conversationUUID);
const help = await client.helpSearch('billing', 'en');
```

`user_hash` is hex HMAC-SHA256(identity secret, user_id), produced on your server
(e.g. `@getclickfix/node.identityHash`); with `company: { id }` it is
hex HMAC-SHA256(identity secret, user_id + "\n" + company_id). Never ship the
secret to the browser.
Session tokens are renewed by bootstrap/identify. Calls accept AbortSignals.
`useConversations`, `useMessages` and `useHelpSearch` return `{data,error,loading,reload}`;
mount conversation/message hooks after a visitor is ready. They abort stale requests
and reload when the session changes. `useTyping` returns the typing mutation;
throttle UI keystrokes to the existing API limit. Mutations do not retry automatically:
retain a stable `client_id` to safely retry message sends. File sends use multipart
at the same message endpoint; structured profile/events are JSON-only. URLs for
attachments come from the API; never assemble storage keys. Render text safely.

`client.realtimeToken()` exposes the existing visitor realtime credentials; your
application can connect its own transport and call `reload` after events. The SDK
owns no socket or polling loop. `rate` and `updateProfile` cover optional visitor
features. All requests omit cookies and use only the visitor Bearer token. No UI,
CSS, global event listeners or browser storage side effects are included.

## Script SDK hooks

For the ready-made messenger UI (Shadow DOM, launcher, home, help, triggers…), load the
script SDK with typed hooks. Types are the public `widget.d.ts` contract
(`src/clickfix.d.ts` is a copy; `pnpm test` fails when it drifts).

```tsx
'use client';
import { useMemo } from 'react';
import { useClickFix, useClickFixEvent } from '@getclickfix/react-widget';

export function Support({ consent }: { consent: boolean }) {
  const options = useMemo(() => consent
    ? { appOrigin: 'https://app.example.com', widgetId: 'public-id', hideLauncher: true }
    : null, [consent]);          // null delays loading until consent
  const { ready, unread, open, sdk } = useClickFix(options);
  useClickFixEvent('conversation:ended', e => console.log(e.status));
  return <button aria-expanded={open} disabled={!ready} onClick={() => sdk.toggle()}>
    Support {unread || ''}
  </button>;
}
```

`loadClickFix(options)` injects `widget.js` once and boots it; `clickFix()` returns the
global SDK (calls are queued until `widget.js` has loaded). `useClickFix` shuts the widget down on unmount.
The hooks never touch `window` while rendering, so a component that uses them renders on the
server (Next.js App Router, static prerendering) without a client-only wrapper; the `sdk` they
return is resolved when you call it, from an effect or an event handler. `sdk('reset')` and
`sdk.reset()` both return a promise that resolves once the new anonymous session exists.
Full command and event list: [docs/widget-sdk.md](../../docs/widget-sdk.md);
a runnable Next.js app: [clickfix-examples/nextjs-widget](https://github.com/ClickSolveMainTR/clickfix-examples/tree/main/nextjs-widget).
