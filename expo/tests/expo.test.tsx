import { act, render, renderHook, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ClickFixExpoProvider, appPackageName, appVersion, conversationURL, fileAttachment, pickAttachment, secureStoreStorage, tokenStorageKey, useClickFix, useExpoDeepLinkConversation, useVisitor } from '../src/index';
import { ChatScreen } from '@getclickfix/react-native/ui';
import { createStub } from '../../react-native/tests/stub';
import * as secureStore from './mocks/expo-secure-store';
import * as fs from './mocks/expo-file-system';
import * as linking from './mocks/expo-linking';
import constants from './mocks/expo-constants';

test('ClickFixExpoProvider takes the package name from app.json and keeps the token in SecureStore', async () => {
  const stub = createStub();
  const { result } = await renderHook(() => ({ ctx: useClickFix(), visitor: useVisitor() }), {
    wrapper: ({ children }) => (
      <ClickFixExpoProvider appKey="cf_app_test" widgetId="w-1" baseUrl="https://support.example.test" fetch={stub.fetch} getUserHash={async (id) => `hash:${id}`} secureStore={{ options: { keychainService: 'cf' } }}>
        {children}
      </ClickFixExpoProvider>
    ),
  });
  await waitFor(() => expect(result.current.ctx.status).toBe('ready'));
  expect(stub.calls[0]!.headers['X-ClickFix-App-Package']).toBe('com.example.app');
  expect(secureStore.store.get(tokenStorageKey('w-1'))).toBe('tok-1');
  expect(secureStore.calls).toContainEqual(['set', 'clickfix.visitor-token.w-1', { keychainService: 'cf' }]);
  await act(async () => {
    await result.current.visitor.identify({ userId: '1001' });
  });
  expect(stub.calls.at(-1)!.body).toEqual({ user_id: '1001', user_hash: 'hash:1001' });

  // Next launch: the stored token resumes the same visitor.
  const again = await renderHook(() => useClickFix(), {
    wrapper: ({ children }) => (
      <ClickFixExpoProvider appKey="cf_app_test" widgetId="w-1" baseUrl="https://support.example.test" fetch={stub.fetch}>
        {children}
      </ClickFixExpoProvider>
    ),
  });
  await waitFor(() => expect(again.result.current.status).toBe('ready'));
  expect(again.result.current.session.visitor?.verified).toBe(true);
  expect(stub.calls.at(-1)!.headers.Authorization).toBe('Bearer tok-1');
});

test('ClickFixExpoProvider needs an explicit package name when app.json has none (Expo Go)', async () => {
  const saved = constants.expoConfig;
  constants.expoConfig = null;
  constants.executionEnvironment = 'storeClient';
  const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    await expect(render(<ClickFixExpoProvider appKey="k" widgetId="w" baseUrl="https://x.test" autoInit={false}><Text>x</Text></ClickFixExpoProvider>)).rejects.toThrow(/Expo Go/);
    expect(appPackageName()).toBeNull();
    const ok = await render(<ClickFixExpoProvider appKey="k" widgetId="w" baseUrl="https://x.test" packageName="com.example.dev" autoInit={false}><Text>x</Text></ClickFixExpoProvider>);
    expect(ok.getByText('x')).toBeTruthy();
  } finally {
    constants.expoConfig = saved;
    constants.executionEnvironment = 'standalone';
    error.mockRestore();
  }
  expect(appPackageName()).toBe('com.example.app');
  expect(appVersion()).toBe('1.2.3');
});

test('secureStoreStorage, fileAttachment and pickAttachment adapt the Expo modules', async () => {
  const storage = secureStoreStorage();
  await storage.set('clickfix.visitor-token.w', 'v');
  expect(await storage.get('clickfix.visitor-token.w')).toBe('v');
  await storage.remove('clickfix.visitor-token.w');
  expect(await storage.get('clickfix.visitor-token.w')).toBeNull();

  fs.files.set('file:///cache/photo.HEIC', { size: 2048, type: '' });
  fs.files.set('file:///cache/doc.pdf', { size: 10, type: 'application/pdf' });
  expect(fileAttachment('file:///cache/photo.HEIC')).toEqual({ uri: 'file:///cache/photo.HEIC', name: 'photo.HEIC', type: 'image/heic' });
  expect(fileAttachment('file:///cache/doc.pdf', { name: 'invoice.pdf' })).toEqual({ uri: 'file:///cache/doc.pdf', name: 'invoice.pdf', type: 'application/pdf' });
  expect(() => fileAttachment('file:///cache/photo.HEIC', { maxBytes: 1024 })).toThrow(/exceeds/);
  expect(() => fileAttachment('file:///missing')).toThrow(/not found/);
  fs.setPicked(null);
  expect(await pickAttachment()).toBeNull();
  fs.setPicked({ uri: 'file:///cache/doc.pdf' });
  expect(await pickAttachment()).toMatchObject({ name: 'doc.pdf' });
});

test('deep links: conversationURL builds an app-scheme link and the hook follows expo-linking', async () => {
  expect(conversationURL('abc-123')).toBe('myapp://conversation/abc-123');
  linking.setURL(null);
  const { result } = await renderHook(() => useExpoDeepLinkConversation());
  expect(result.current.conversation).toBeNull();
  await act(async () => linking.setURL('exp://192.168.1.5:8081/--/conversation/abc-12345'));
  expect(result.current.conversation).toBe('abc-12345');
  await act(async () => result.current.clear());
  expect(result.current.conversation).toBeNull();
  await act(async () => linking.setURL('myapp://home'));
  expect(result.current.conversation).toBeNull();
});

test('the react-native screens work unchanged under the Expo provider', async () => {
  const stub = createStub();
  const uuid = stub.seed(1);
  const screen = await render(
    <ClickFixExpoProvider appKey="cf_app_test" widgetId="w-2" baseUrl="https://support.example.test" fetch={stub.fetch}>
      <ChatScreen conversation={uuid} pollMs={0} pickFile={pickAttachment} />
    </ClickFixExpoProvider>,
  );
  await screen.findByText('m1');
  expect(screen.getByTestId('clickfix-attach')).toBeTruthy();
});
