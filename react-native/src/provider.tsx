// ClickFixProvider (CF-202): one visitor client per app, the token in the
// keystore adapter you pass, realtime over React Native's WebSocket, and a
// foreground hook so lists refresh when the app comes back.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import {
  createRealtime,
  createVisitorClient,
  type FetchLike,
  type Session,
  type WebSocketCtor,
} from '@getclickfix/visitor-core';
import { ClickFixContext, type ClickFixContextValue, type ClickFixStatus, type GetUserHash, type RealtimeEvent } from './context.js';
import { memoryStorage, tokenStorageKey, type SecureStorage } from './storage.js';

export interface ClickFixProviderProps {
  /** Mobile app key from Web widget → Advanced → Mobile apps. */
  appKey: string;
  /** The app's bundle id (iOS) or application id (Android), as registered with the key. */
  packageName: string;
  /** Public widget id. */
  widgetId: string;
  /** The ClickFix app's absolute URL, e.g. `https://support.example.com` (`/api` is added). */
  baseUrl: string;
  /** Resolves `user_hash` from your server; lets `identify({ userId })` omit it. */
  getUserHash?: GetUserHash;
  /** Token storage; default memory. Bare RN: `keychainStorage`, Expo: `@getclickfix/expo`. */
  storage?: SecureStorage;
  /** Two-letter device language sent with bootstrap. */
  language?: string;
  /** Initial screen name (`page_url` of bootstrap and messages). */
  screen?: string;
  /** Bootstrap on mount (default true); otherwise call `useClickFix().init()`. */
  autoInit?: boolean;
  /** Follow the visitor's realtime channel when the widget enables it (default true). */
  realtime?: boolean;
  /** Total attempts for retryable requests (default 3, at most 5). */
  attempts?: number;
  fetch?: FetchLike;
  WebSocket?: WebSocketCtor;
  onError?: (error: unknown) => void;
  children?: ReactNode;
}

export function ClickFixProvider(props: ClickFixProviderProps) {
  const { appKey, packageName, widgetId, baseUrl, autoInit = true, realtime = true } = props;
  const storage = useMemo(() => props.storage ?? memoryStorage(), [props.storage]);
  const storageRef = useRef(storage);
  storageRef.current = storage;
  const errorRef = useRef(props.onError);
  errorRef.current = props.onError;
  const key = tokenStorageKey(widgetId);

  // The client is created once; identity props are read at mount.
  const [client] = useState(() =>
    createVisitorClient({
      mode: 'app',
      baseURL: `${baseUrl.replace(/\/+$/, '')}/api`,
      publicId: widgetId,
      app: { key: appKey, packageName },
      fetch: props.fetch,
      language: props.language,
      screen: props.screen,
      attempts: props.attempts,
      onToken: (token) => {
        const store = storageRef.current;
        void (token ? store.set(key, token) : store.remove(key)).catch((err: unknown) => errorRef.current?.(err));
      },
    }),
  );
  const [session, setSession] = useState<Session>(client.getSnapshot());
  const [status, setStatus] = useState<ClickFixStatus>('idle');
  const [error, setError] = useState<unknown>(null);
  const [connected, setConnected] = useState(false);
  const listeners = useRef(new Set<(event: RealtimeEvent) => void>());
  const emit = useCallback((event: RealtimeEvent) => {
    for (const fn of listeners.current) fn(event);
  }, []);
  const subscribe = useCallback((fn: (event: RealtimeEvent) => void) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  useEffect(() => client.subscribe(() => setSession(client.getSnapshot())), [client]);

  const restored = useRef<Promise<void> | null>(null);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  const init = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      // Resume the stored session once; a stale token renews itself on the first request.
      restored.current ??= storage
        .get(key)
        .then((token) => {
          if (token && !client.getToken()) client.adoptToken(token);
        })
        .catch(() => undefined);
      await restored.current;
      await client.init();
      if (mounted.current) setStatus('ready');
    } catch (err) {
      if (mounted.current) {
        setStatus('error');
        setError(err);
      }
      errorRef.current?.(err);
      throw err;
    }
  }, [client, storage, key]);

  useEffect(() => {
    if (autoInit) init().catch(() => undefined);
    // Only at mount: the provider owns the session for the app's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enabled = realtime && session.bootstrap?.realtime.enabled === true;
  useEffect(() => {
    if (!enabled) return;
    const rt = createRealtime({
      tokens: () => client.realtimeToken(),
      onEvent: (data) => {
        if (data && typeof data === 'object' && typeof (data as RealtimeEvent).type === 'string') emit(data as RealtimeEvent);
      },
      onState: setConnected,
      WebSocket: props.WebSocket,
      name: 'clickfix-react-native',
    });
    rt.start();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        rt.kick();
        emit({ type: 'app.foreground' });
      }
    });
    return () => {
      sub.remove();
      rt.stop();
      setConnected(false);
    };
    // The socket follows the client, not the props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, enabled, emit]);

  useEffect(() => {
    if (enabled) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') emit({ type: 'app.foreground' });
    });
    return () => sub.remove();
  }, [enabled, emit]);

  const value = useMemo<ClickFixContextValue>(
    () => ({ client, widgetId, session, status, error, connected, init, subscribe, getUserHash: props.getUserHash }),
    [client, widgetId, session, status, error, connected, init, subscribe, props.getUserHash],
  );
  return <ClickFixContext.Provider value={value}>{props.children}</ClickFixContext.Provider>;
}
