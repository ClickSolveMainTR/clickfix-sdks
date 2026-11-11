// Script SDK bindings (CF-150): typed React hooks around window.ClickFix,
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

/** Installs the queue stub (calls before the script loads are replayed). */
function stub(): ClickFixSDK {
  const w = window as unknown as { ClickFix?: Queue };
  if (!w.ClickFix) {
    const q: Queue = (...args: unknown[]) => { (q.q ??= []).push(args); };
    w.ClickFix = q;
  }
  return w.ClickFix as unknown as ClickFixSDK;
}

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

/** The global SDK (stubbed until widget.js has loaded). */
export function clickFix(): ClickFixSDK {
  return stub();
}

/** Subscribes to a widget event for the component's lifetime. */
export function useClickFixEvent<E extends ClickFixEvent>(event: E, handler: ClickFixHandler<E>) {
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
  return { ready, open, unread, state, sdk: stub() };
}
