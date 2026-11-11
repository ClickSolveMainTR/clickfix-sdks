// Webview bridge types (CF-199 contract, docs/webview-bridge.md) shared
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
  | { type: 'clickfix:event'; event: string; payload: unknown }
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
 * null for anything that is not a known widget → host message, so other
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
      return typeof m.event === 'string' ? (m as BridgeMessage) : null;
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
