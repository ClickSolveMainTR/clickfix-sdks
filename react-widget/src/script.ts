// Script SDK bindings: typed React hooks around window.ClickFix,
// the full widget UI loaded from https://<app>/widget.js. Use these for the
// ready-made messenger; use createWidgetClient (index.ts) to build your own UI.
import { useEffect, useRef, useState } from 'react';
import type {
  ClickFixEvent, ClickFixEventMap, ClickFixHandler, ClickFixInitOptions, ClickFixSDK, ClickFixState,
} from './clickfix.js';
export type * from './clickfix.js';

type Queue = ((...args: unknown[]) => unknown) & { q?: unknown[][] };
export interface LoadOptions extends ClickFixInitOptions {
  /** ClickFix app origin that serves widget.js, e.g. https://app.clickfix.example */
  appOrigin: string;
  widgetId: string;
}

/** Installs the queue stub (calls before the script loads are replayed). Browser only. */
function stub(): ClickFixSDK {
  const w = window as unknown as { ClickFix?: Queue };
  if (!w.ClickFix) {
    const q: Queue = (...args: unknown[]) => { (q.q ??= []).push(args); };
    w.ClickFix = q;
  }
  return w.ClickFix as unknown as ClickFixSDK;
}

type AnyFn = (...args: unknown[]) => unknown;
/** Method names of ClickFixSDK (widget.d.ts); a type test keeps the list complete. */
export const SDK_METHODS: ReadonlySet<string> = new Set<Exclude<keyof ClickFixSDK, 'version'>>([
  'init', 'boot', 'open', 'close', 'toggle', 'show', 'hide', 'showLauncher', 'hideLauncher',
  'identify', 'update', 'setAttributes', 'track', 'startConversation', 'showNewMessage', 'showMessage',
  'openArticle', 'searchHelp', 'setLocale', 'setTheme', 'consent', 'getUnreadCount', 'getVisitorId',
  'isOpen', 'getState', 'on', 'once', 'off', 'startReplay', 'stopCapture', 'reset', 'shutdown',
]);
/**
 * The SDK handle the hooks hand out. It resolves window.ClickFix on every call,
 * never while rendering, so a component using the hooks can be rendered on the
 * server (Next.js SSR, static prerendering). Before widget.js has loaded a
 * method call (`sdk.reset()`) goes through the queue like the command form
 * (`sdk('reset')`). Calling it on the server throws a clear error.
 */
const lazySDK = new Proxy(function clickFix() {} as unknown as AnyFn, {
  apply(_target, _this, args: unknown[]) {
    if (typeof window === 'undefined') throw new Error('ClickFix: the widget SDK is only available in the browser (call it from an effect or an event handler)');
    return (stub() as unknown as AnyFn)(...args);
  },
  get(_target, prop) {
    if (typeof prop !== 'string' || typeof window === 'undefined') return undefined;
    const sdk = stub() as unknown as AnyFn & Record<string, unknown>;
    if (prop === 'version') return sdk.version;
    // Only ClickFixSDK methods: anything else (then, toJSON, $$typeof, constructor…) is
    // undefined, so the handle is not a thenable and serializes like a plain function.
    if (!SDK_METHODS.has(prop)) return undefined;
    const value = sdk[prop];
    if (typeof value === 'function') return (value as AnyFn).bind(sdk);
    return (...args: unknown[]) => sdk(prop, ...args);
  },
}) as unknown as ClickFixSDK;

/** Loads widget.js once and boots the widget. Returns the global SDK. */
export function loadClickFix(options: LoadOptions): ClickFixSDK {
  const { appOrigin, ...init } = options;
  const sdk = stub();
  const src = `${appOrigin.replace(/\/$/, '')}/widget.js`;
  if (!document.querySelector(`script[src="${src}"]`)) {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.manual = 'true';
    document.head.appendChild(script);
  }
  sdk('boot', init);
  return sdk;
}

/** The global SDK (queued until widget.js has loaded). Safe to call while rendering; use it in effects and handlers. */
export function clickFix(): ClickFixSDK {
  return lazySDK;
}

/** Subscribes to a widget event for the component's lifetime. */
export function useClickFixEvent<E extends ClickFixEvent>(event: E, handler: ClickFixHandler<E>): void {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const sdk = stub();
    const fn = ((payload: ClickFixEventMap[E]) => ref.current(payload)) as ClickFixHandler<E>;
    sdk('on', event, fn);
    return () => sdk('off', event, fn);
  }, [event]);
}

export interface ClickFixWidgetState {
  ready: boolean;
  open: boolean;
  unread: number;
  state: ClickFixState | undefined;
  sdk: ClickFixSDK;
}

/**
 * Loads and boots the widget once (pass a stable options object or memoize
 * it), shuts it down on unmount and tracks ready/open/unread.
 * `options` null delays loading (e.g. until consent).
 */
export function useClickFix(options: LoadOptions | null): ClickFixWidgetState {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [state, setState] = useState<ClickFixState | undefined>(undefined);
  const key = options ? `${options.appOrigin}|${options.widgetId}` : '';
  useEffect(() => {
    if (!options) return;
    const sdk = loadClickFix(options);
    const sync = () => setState(sdk('getState'));
    const onReady = () => { setReady(true); sync(); };
    const onOpen = () => { setOpen(true); sync(); };
    const onClose = () => { setOpen(false); sync(); };
    const onUnread = (p: { count: number }) => { setUnread(p.count); sync(); };
    sdk('on', 'ready', onReady);
    sdk('on', 'open', onOpen);
    sdk('on', 'close', onClose);
    sdk('on', 'unread', onUnread);
    return () => {
      sdk('off', 'ready', onReady);
      sdk('off', 'open', onOpen);
      sdk('off', 'close', onClose);
      sdk('off', 'unread', onUnread);
      sdk('shutdown');
      setReady(false);
    };
  }, [key]);
  return { ready, open, unread, state, sdk: lazySDK };
}
