// Realtime abstraction: the widget's Centrifugo client (JSON
// protocol, one channel) without `window`. Any WebSocket-shaped
// constructor works (browser, React Native, `ws` in Node); the host may
// also replace the whole socket layer by passing its own `socket` factory.
import { defaultWebSocket, timers, type WebSocketCtor, type WebSocketLike } from './env.js';
import type { RealtimeToken } from './client.js';

export type RealtimeTokens = RealtimeToken;

export interface RealtimeOptions {
  /** Fresh tokens for every connect (`client.realtimeToken`). */
  tokens: () => Promise<RealtimeTokens>;
  onEvent: (data: unknown) => void;
  onState?: (connected: boolean) => void;
  /** WebSocket constructor; default `globalThis.WebSocket`. */
  WebSocket?: WebSocketCtor;
  /** Replaces `new WebSocket(url)` entirely (EventSource shims, test doubles). */
  socket?: (url: string) => WebSocketLike;
  /** Client name reported to Centrifugo. */
  name?: string;
  /** Upper bound of the reconnect delay in ms (default 30000). */
  maxDelayMs?: number;
}

export interface Realtime {
  start(): void;
  stop(): void;
  /** Reconnect now (the device came back online). */
  kick(): void;
  readonly connected: boolean;
}

export function createRealtime(options: RealtimeOptions): Realtime {
  const open = options.socket ?? ((url: string) => {
    const Ctor = options.WebSocket ?? defaultWebSocket();
    if (!Ctor) throw new Error('WebSocket is not available; pass options.WebSocket or options.socket');
    return new Ctor(url);
  });
  const maxDelay = options.maxDelayMs ?? 30000;
  let ws: WebSocketLike | null = null;
  let id = 0;
  let stopped = true;
  let attempts = 0;
  let timer: unknown;
  let connected = false;

  const setConnected = (v: boolean) => {
    if (connected !== v) {
      connected = v;
      options.onState?.(v);
    }
  };
  const retry = () => {
    if (stopped) return;
    attempts++;
    const delay = Math.min(maxDelay, 1000 * 2 ** Math.min(attempts, 5)) + Math.random() * 1000;
    timer = timers.setTimeout(() => void connect(), delay);
  };
  async function connect() {
    if (stopped) return;
    let t: RealtimeTokens;
    try {
      t = await options.tokens();
    } catch {
      retry();
      return;
    }
    if (stopped) return;
    if (!t.ws_url) return;
    let sock: WebSocketLike;
    try {
      sock = open(t.ws_url);
    } catch {
      retry();
      return;
    }
    ws?.close();
    ws = sock;
    const send = (cmd: Record<string, unknown>) => sock.send(JSON.stringify(cmd));
    sock.onopen = () => {
      send({ id: ++id, connect: { token: t.connection_token, name: options.name ?? 'clickfix-visitor-core' } });
      send({ id: ++id, subscribe: { channel: t.channel, token: t.subscription_token } });
    };
    sock.onmessage = (ev) => {
      for (const line of String(ev.data).split('\n').filter(Boolean)) {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(line) as Record<string, unknown>;
        } catch {
          continue;
        }
        if (Object.keys(msg).length === 0) {
          sock.send('{}'); // server ping → pong
          continue;
        }
        if (msg.error) {
          sock.close();
          continue;
        }
        if (msg.subscribe) {
          attempts = 0;
          setConnected(true);
        }
        const push = msg.push as { channel?: string; pub?: { data?: unknown } } | undefined;
        if (push?.pub && push.channel === t.channel) options.onEvent(push.pub.data);
      }
    };
    sock.onclose = () => {
      if (ws === sock) ws = null;
      setConnected(false);
      retry();
    };
    sock.onerror = () => sock.close();
  }
  return {
    start() {
      if (!stopped) return;
      stopped = false;
      void connect();
    },
    stop() {
      stopped = true;
      timers.clearTimeout(timer);
      ws?.close();
      ws = null;
      setConnected(false);
    },
    kick() {
      if (stopped || connected) return;
      timers.clearTimeout(timer);
      attempts = 0;
      void connect();
    },
    get connected() {
      return connected;
    },
  };
}
