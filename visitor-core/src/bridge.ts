// Webview bridge types (bridge contract v1, docs/webview-bridge.md) shared
// between the widget (frontend/widget-sdk/src/shared/bridge.ts) and native
// SDKs that host the webview. The native side only encodes commands and
// decodes messages; parsing here is shape-checking, never validation of
// user data (the widget validates what it runs).

export const BRIDGE_VERSION = 1;

export type BridgeIdentity = {
  user_id: string;
  user_hash: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: { id?: string; name?: string; domain?: string };
  attributes?: Record<string, string | number | boolean>;
};

export type BridgeView = 'home' | 'messages' | 'help' | 'new';

/** Host (app) → widget. */
export type BridgeCommand =
  | { type: 'clickfix:identify'; id?: string; user: BridgeIdentity }
  | { type: 'clickfix:track'; id?: string; name: string; properties?: Record<string, unknown> }
  | { type: 'clickfix:open'; id?: string; view?: BridgeView; conversation?: string }
  | { type: 'clickfix:close'; id?: string }
  | { type: 'clickfix:update'; id?: string; update: Record<string, unknown> }
  | { type: 'clickfix:consent'; id?: string; granted: boolean }
  | { type: 'clickfix:reset'; id?: string }
  | { type: 'clickfix:get-state'; id?: string }
  /** Continue the visitor session the app started with `createVisitorClient` (app key). */
  | { type: 'clickfix:session'; id?: string; token: string };

export type BridgeCommandType = BridgeCommand['type'];

export const COMMAND_TYPES: readonly BridgeCommandType[] = [
  'clickfix:identify',
  'clickfix:track',
  'clickfix:open',
  'clickfix:close',
  'clickfix:update',
  'clickfix:consent',
  'clickfix:reset',
  'clickfix:get-state',
  'clickfix:session',
];

/**
 * Payloads of the widget SDK events forwarded to the host as `clickfix:event`
 * (the widget's FORWARDED_EVENTS; same shapes as `ClickFixEventMap` in widget.d.ts).
 */
export interface BridgeEventMap {
  ready: { protocol_version: number; sdk_version: string; widget_id: string; visitor_id: string };
  open: { view?: string };
  close: Record<string, never>;
  /** The visitor moved to another tab of the panel. */
  view: { view: string };
  /** An agent (or AI agent: sender_type "bot") reply arrived. */
  message: { conversation_uuid: string; message_uuid: string; text: string; sender_type: string };
  /** The visitor's message was stored. */
  'message:sent': { conversation_uuid: string; message_uuid: string };
  'conversation:started': { conversation_uuid: string };
  /** A conversation was resolved or closed. */
  'conversation:ended': { conversation_uuid: string; status: string };
  /** Unread agent replies across the visitor's conversations changed. */
  unread: { count: number };
  /** `company_verified`: user_hash signed `company.id` too; false when the company was only a hint. */
  identify: { verified: boolean; company_verified: boolean };
  /** The CSAT survey was answered. */
  csat: { conversation_uuid: string; score: number; existing: boolean };
  /** A proactive message trigger fired. */
  trigger: { id: string; name: string; message: string };
  /** setAttributes result (pending: sent with the first message). */
  attributes: { applied: string[]; ignored: string[]; pending: boolean };
  consent: { granted: boolean };
  /** Page targeting changed. */
  visibility: { visible: boolean; reason: string };
  reset: Record<string, never>;
  track: { name: string; properties?: Record<string, unknown> };
  error: { code: string; message: string };
}

export type BridgeEventName = keyof BridgeEventMap;

/**
 * A `clickfix:event` message. Narrow on `event` to get the payload type:
 * `if (m.type === 'clickfix:event' && m.event === 'unread') m.payload.count`.
 */
export type BridgeEvent<E extends BridgeEventName = BridgeEventName> = {
  [K in E]: { type: 'clickfix:event'; event: K; payload: BridgeEventMap[K] };
}[E];

export const EVENT_NAMES: readonly BridgeEventName[] = [
  'ready',
  'open',
  'close',
  'view',
  'message',
  'message:sent',
  'conversation:started',
  'conversation:ended',
  'unread',
  'identify',
  'csat',
  'trigger',
  'attributes',
  'consent',
  'visibility',
  'reset',
  'track',
  'error',
];

/** Widget → host (app). */
export type BridgeMessage =
  | {
      type: 'clickfix:ready';
      bridge_version: number;
      protocol_version: number;
      sdk_version: string;
      widget_id: string;
      visitor_id: string;
    }
  | BridgeEvent
  | { type: 'clickfix:link'; url: string }
  | { type: 'clickfix:result'; id: string; ok: boolean; data?: unknown; error?: { code: string; message: string } }
  /** The webview's visitor token after ready, identify and reset (`token` is "" after reset). */
  | { type: 'clickfix:session'; token: string; visitor_id: string };

export type BridgeMessageType = BridgeMessage['type'];

export const MESSAGE_TYPES: readonly BridgeMessageType[] = [
  'clickfix:ready',
  'clickfix:event',
  'clickfix:link',
  'clickfix:result',
  'clickfix:session',
];

/** JSON text for `window.ClickFixBridge.receive(...)` / `postMessage`. */
export function encodeCommand(command: BridgeCommand): string {
  return JSON.stringify(command);
}

/**
 * JavaScript that delivers a command to the widget inside a webview
 * (`injectJavaScript`, `evaluateJavascript`, `runJavaScript`). The command is
 * double-encoded so the JSON travels as one string literal.
 */
export function commandScript(command: BridgeCommand): string {
  return `window.ClickFixBridge && window.ClickFixBridge.receive(${JSON.stringify(encodeCommand(command))}); true;`;
}

/**
 * Decodes a message the widget posted to the host (`onMessage` data). Returns
 * null for anything that is not a known widget → host message (including a
 * `clickfix:event` with an event name outside `EVENT_NAMES`), so other
 * scripts' traffic in the same webview is ignored.
 */
export function parseMessage(raw: unknown): BridgeMessage | null {
  let data: unknown = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  const m = data as Record<string, unknown>;
  if (typeof m.type !== 'string' || !(MESSAGE_TYPES as readonly string[]).includes(m.type)) return null;
  switch (m.type as BridgeMessageType) {
    case 'clickfix:ready':
      return typeof m.widget_id === 'string' ? (m as BridgeMessage) : null;
    case 'clickfix:event':
      // Events this version does not know are ignored like foreign traffic; payloads are the widget's own.
      return typeof m.event === 'string' && (EVENT_NAMES as readonly string[]).includes(m.event) && typeof m.payload === 'object' && m.payload !== null
        ? (m as BridgeMessage)
        : null;
    case 'clickfix:link':
      return typeof m.url === 'string' ? (m as BridgeMessage) : null;
    case 'clickfix:result':
      return typeof m.id === 'string' && typeof m.ok === 'boolean' ? (m as BridgeMessage) : null;
    case 'clickfix:session':
      return typeof m.token === 'string' ? (m as BridgeMessage) : null;
  }
  return null;
}

/**
 * Whether a `clickfix:link` url may be opened in the system browser: only
 * https (and http://localhost while developing); never a custom scheme or
 * an intent handler.
 */
export function isSafeLink(url: string): boolean {
  return /^https:\/\/[^/\s]+/i.test(url) || /^http:\/\/localhost(:\d+)?(\/|$)/i.test(url);
}
