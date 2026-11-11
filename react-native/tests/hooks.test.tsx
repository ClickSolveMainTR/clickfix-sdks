import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import {
  ClickFixProvider,
  memoryStorage,
  keychainStorage,
  parseConversationLink,
  tokenStorageKey,
  useClickFix,
  useConversation,
  useConversations,
  useHelpSearch,
  useRating,
  useVisitor,
  useDeepLinkConversation,
  type ClickFixProviderProps,
  type SecureStorage,
} from '../src/index';
import { createStub } from './stub';

const WIDGET = 'w-1234';
function wrapper(stub: ReturnType<typeof createStub>, props: Partial<ClickFixProviderProps> = {}) {
  return ({ children }: { children: ReactNode }) => (
    <ClickFixProvider appKey="cf_app_test" packageName="com.example.app" widgetId={WIDGET} baseUrl="https://support.example.test/" fetch={stub.fetch} {...props}>
      {children}
    </ClickFixProvider>
  );
}
const ready = (result: { current: { status: string } }) => waitFor(() => expect(result.current.status).toBe('ready'));

test('provider bootstraps with the app key headers, restores the stored token and persists new ones', async () => {
  const stub = createStub({ knownTokens: ['tok-1'] });
  const storage = memoryStorage();
  await storage.set(tokenStorageKey(WIDGET), 'tok-1');
  const { result } = await renderHook(() => useClickFix(), { wrapper: wrapper(stub, { storage, language: 'tr', screen: 'home' }) });
  await ready(result);
  expect(stub.calls[0]).toMatchObject({ method: 'POST', path: '/bootstrap', headers: { 'X-ClickFix-App-Key': 'cf_app_test', 'X-ClickFix-App-Package': 'com.example.app', Authorization: 'Bearer tok-1' } });
  expect(stub.calls[0]!.body).toMatchObject({ page_url: 'home', language: 'tr', sdk_version: expect.stringContaining('core-') });
  expect(result.current.session.visitor?.id).toBe('v-1');
  expect(result.current.connected).toBe(false);

  // A stale token: the API starts a new visitor; the new token is stored.
  const stale = createStub();
  const store2 = memoryStorage();
  await store2.set(tokenStorageKey(WIDGET), 'tok-stale');
  const second = await renderHook(() => useClickFix(), { wrapper: wrapper(stale, { storage: store2 }) });
  await ready(second.result);
  expect(second.result.current.session.visitor?.id).toBe('v-1');
  expect(await store2.get(tokenStorageKey(WIDGET))).toBe('tok-1');
});

test('provider reports bootstrap errors and init() retries; autoInit=false waits', async () => {
  let fail = true;
  const stub = createStub();
  const fetch: typeof stub.fetch = async (url, init) => {
    if (fail) throw new TypeError('offline');
    return stub.fetch(url, init);
  };
  const onError = jest.fn();
  const { result } = await renderHook(() => useClickFix(), { wrapper: wrapper(stub, { fetch, attempts: 1, onError, autoInit: false }) });
  expect(result.current.status).toBe('idle');
  await act(async () => {
    await result.current.init().catch(() => undefined);
  });
  expect(result.current.status).toBe('error');
  expect(onError).toHaveBeenCalledTimes(1);
  fail = false;
  await act(async () => {
    await result.current.init();
  });
  expect(result.current.status).toBe('ready');
});

test('useVisitor identifies with getUserHash (user and company), sets attributes, tracks events and resets', async () => {
  const stub = createStub();
  const getUserHash = jest.fn(async (userId: string, companyId?: string) => `hash:${userId}:${companyId ?? ''}`);
  const { result } = await renderHook(() => useVisitor(), { wrapper: wrapper(stub, { getUserHash }) });
  await ready(result);
  expect(result.current.verified).toBe(false);
  await act(async () => {
    await result.current.identify({ userId: '1001', name: 'Ayşe', email: 'ayse@example.test', company: { id: 'F-77', name: 'Firma' } });
  });
  expect(getUserHash).toHaveBeenCalledWith('1001', 'F-77');
  expect(stub.calls.at(-1)!.body).toEqual({ user_id: '1001', user_hash: 'hash:1001:F-77', name: 'Ayşe', email: 'ayse@example.test', company: { id: 'F-77', name: 'Firma' } });
  expect(result.current.verified).toBe(true);
  expect(result.current.visitor?.company_verified).toBe(true);
  expect(result.current.visitor?.contact?.name).toBe('Ayşe');

  await act(async () => {
    await result.current.identify({ userId: '1002', userHash: 'hash:explicit' });
  });
  expect(stub.calls.at(-1)!.body).toEqual({ user_id: '1002', user_hash: 'hash:explicit' });

  await act(async () => {
    expect(await result.current.setAttributes({ plan: 'pro', seats: 3 })).toMatchObject({ applied: ['plan', 'seats'] });
  });
  result.current.setScreen('orders/42');
  result.current.track('viewed_order', { id: 42 });

  await act(async () => {
    await result.current.reset();
  });
  expect(result.current.verified).toBe(false);
  expect(stub.calls.at(-1)).toMatchObject({ path: '/bootstrap' });
  expect(stub.calls.at(-1)!.headers.Authorization).toBeUndefined();
});

test('identify without userHash and without getUserHash fails before any request', async () => {
  const stub = createStub();
  const { result } = await renderHook(() => useVisitor(), { wrapper: wrapper(stub) });
  await ready(result);
  const n = stub.calls.length;
  await expect(result.current.identify({ userId: 'u' })).rejects.toThrow(/getUserHash/);
  expect(stub.calls.length).toBe(n);
});

test('useConversations lists bootstrap conversations, creates one and reloads on realtime pushes', async () => {
  const stub = createStub();
  stub.seed(2);
  const { result } = await renderHook(() => ({ list: useConversations(), ctx: useClickFix() }), { wrapper: wrapper(stub) });
  await waitFor(() => expect(result.current.ctx.status).toBe('ready'));
  expect(result.current.list.items).toHaveLength(1);
  expect(stub.calls.filter((c) => c.path === '/conversations')).toHaveLength(0);

  let sent!: Awaited<ReturnType<typeof result.current.list.create>>;
  await act(async () => {
    sent = await result.current.list.create('Merhaba');
  });
  expect(sent.created).toBe(true);
  await waitFor(() => expect(result.current.list.items).toHaveLength(2));
  const call = stub.calls.find((c) => c.method === 'POST' && c.path === '/conversations')!;
  expect(call.body).toEqual({ text: 'Merhaba', client_id: expect.any(String) });
});

test('useConversation loads messages oldest first, sends text and files, pages history, marks read and tracks typing', async () => {
  const stub = createStub();
  const uuid = stub.seed(60);
  const { result } = await renderHook(() => useConversation(uuid, { pollMs: 0 }), { wrapper: wrapper(stub) });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.messages).toHaveLength(50);
  expect(result.current.messages[0]!.content).toBe('m11');
  expect(result.current.messages.at(-1)!.content).toBe('m60');
  expect(result.current.hasMore).toBe(true);
  expect(result.current.unread).toBe(25);

  await act(async () => {
    await result.current.loadMore();
  });
  expect(result.current.messages).toHaveLength(60);
  expect(result.current.messages[0]!.content).toBe('m1');
  expect(result.current.hasMore).toBe(false);

  await act(async () => {
    await result.current.send('Teşekkürler');
  });
  expect(result.current.messages.at(-1)!.content).toBe('Teşekkürler');
  await act(async () => {
    await result.current.send({ text: 'ek' }, { uri: 'file:///tmp/a.png', name: 'a.png', type: 'image/png' });
  });
  const upload = stub.calls.at(-1)!;
  expect(upload.body).toMatchObject({ text: 'ek', file: { uri: 'file:///tmp/a.png', name: 'a.png', type: 'image/png' } });
  expect(upload.headers['Content-Type']).toBeUndefined();
  expect(result.current.messages.at(-1)!.attachments[0]!.filename).toBe('a.png');

  await act(async () => {
    await result.current.markRead();
  });
  expect(stub.calls.at(-1)).toMatchObject({ method: 'POST', path: `/conversations/${uuid}/read` });
  expect(result.current.unread).toBe(0);

  const before = stub.calls.length;
  await act(async () => {
    await result.current.setTyping(true);
    await result.current.setTyping(true); // throttled
    await result.current.setTyping(false);
  });
  expect(stub.calls.slice(before).map((c) => c.body)).toEqual([{ typing: true }, { typing: false }]);

  // A new conversation: the first send creates it and uuid is set.
  const fresh = await renderHook(() => useConversation(null, { pollMs: 0 }), { wrapper: wrapper(stub) });
  await waitFor(() => expect(fresh.result.current.loading).toBe(false));
  expect(fresh.result.current.uuid).toBeNull();
  await act(async () => {
    await fresh.result.current.send('yeni');
  });
  expect(fresh.result.current.uuid).toBe(stub.conversations.at(-1)!.uuid);
  expect(fresh.result.current.messages.map((m) => m.content)).toEqual(['yeni']);
});

test('useConversation polls for new messages while realtime is down', async () => {
  const stub = createStub();
  const uuid = stub.seed(1);
  const { result } = await renderHook(() => useConversation(uuid, { pollMs: 30 }), { wrapper: wrapper(stub) });
  await waitFor(() => expect(result.current.messages).toHaveLength(1));
  stub.reply(uuid, 'Hello from the agent');
  await waitFor(() => expect(result.current.messages).toHaveLength(2), { timeout: 2000 });
  const poll = stub.calls.filter((c) => c.path === `/conversations/${uuid}/messages` && c.method === 'GET').at(-1)!;
  expect(poll.path).toContain('/messages');
  expect(result.current.messages.at(-1)!.direction).toBe('out');
});

test('useHelpSearch debounces and ignores empty queries; useRating submits once', async () => {
  const stub = createStub();
  const uuid = stub.seed(1);
  stub.resolve(uuid);
  const { result, rerender } = await renderHook(({ q }: { q: string }) => ({ help: useHelpSearch(q, 'en', { debounceMs: 10 }), rating: useRating(uuid), ctx: useClickFix() }), {
    wrapper: wrapper(stub),
    initialProps: { q: '' },
  });
  await waitFor(() => expect(result.current.ctx.status).toBe('ready'));
  expect(result.current.help.result).toBeNull();
  await rerender({ q: 'inv' });
  await rerender({ q: 'invoice' });
  await waitFor(() => expect(result.current.help.result?.items[0]?.title).toBe('About invoice'));
  expect(stub.calls.filter((c) => c.path === '/help/search')).toHaveLength(1);
  expect(stub.calls.at(-1)!.path).toBe('/help/search');

  await act(async () => {
    await result.current.rating.submit(5, 'great');
  });
  expect(result.current.rating.rating).toMatchObject({ score: 5, comment: 'great' });
  expect(stub.calls.at(-1)!.body).toEqual({ score: 5, comment: 'great' });
});

test('keychain adapter maps to react-native-keychain and deep links resolve a conversation', async () => {
  const entries = new Map<string, string>();
  const keychain = {
    setGenericPassword: jest.fn(async (_u: string, p: string, o?: { service?: string }) => {
      entries.set(o!.service!, p);
      return true;
    }),
    getGenericPassword: jest.fn(async (o?: { service?: string }) => (entries.has(o!.service!) ? { username: 'clickfix', password: entries.get(o!.service!)! } : (false as const))),
    resetGenericPassword: jest.fn(async (o?: { service?: string }) => entries.delete(o!.service!)),
  };
  const storage: SecureStorage = keychainStorage(keychain, { servicePrefix: 'app.' });
  await storage.set('k', 'v');
  expect(await storage.get('k')).toBe('v');
  expect(keychain.setGenericPassword).toHaveBeenCalledWith('clickfix', 'v', { service: 'app.k' });
  await storage.remove('k');
  expect(await storage.get('k')).toBeNull();

  expect(parseConversationLink('https://app.example.com/support?x=1&conversation=1f2a3b4c-aaaa-bbbb-cccc-dddddddddddd')).toBe('1f2a3b4c-aaaa-bbbb-cccc-dddddddddddd');
  expect(parseConversationLink('myapp://support/conversation/abc12345')).toBe('abc12345');
  expect(parseConversationLink('exp://192.168.1.2:8081/--/conversations/abc12345#frag')).toBe('abc12345');
  expect(parseConversationLink('myapp://home')).toBeNull();
  expect(parseConversationLink('myapp://conversation/..%2F..')).toBeNull();
  expect(parseConversationLink(null)).toBeNull();

  let handler: ((e: { url: string }) => void) | null = null;
  const linking = {
    getInitialURL: async () => 'myapp://conversation/first123',
    addEventListener: (_t: 'url', h: (e: { url: string }) => void) => {
      handler = h;
      return { remove: () => (handler = null) };
    },
  };
  const { result, unmount } = await renderHook(() => useDeepLinkConversation(linking));
  await waitFor(() => expect(result.current.conversation).toBe('first123'));
  await act(() => handler!({ url: 'myapp://conversation/second12' }));
  expect(result.current.conversation).toBe('second12');
  await act(() => result.current.clear());
  expect(result.current.conversation).toBeNull();
  await unmount();
  expect(handler).toBeNull();
});
