/**
 * ClickFix web widget SDK — public TypeScript contract (protocol version 1,
 * SDK 2.x; every 1.x call keeps working). SDK 2.1 adds the webview bridge
 * (docs/webview-bridge.md).
 *
 * Served at https://<app>/widget.d.ts next to https://<app>/widget.js.
 * Copy it into your project (e.g. `types/clickfix-widget.d.ts`) to type
 * `window.ClickFix`, or use @getclickfix/react-widget. Source:
 * frontend/widget-sdk/src/widget.ts. Docs: docs/widget-sdk.md.
 */

export type ClickFixLocale = "tr" | "en";
export type ClickFixTheme = "light" | "dark" | "auto";
export type ClickFixView = "home" | "messages" | "help" | "new" | "chat";
export type ClickFixAttributes = Record<string, string | number | boolean>;

export interface ClickFixInitOptions {
  /** Public widget id (shown in ClickFix → Web widget → Install). */
  widgetId?: string;
  /** Overrides the widget's language (default: widget setting, else browser). */
  locale?: ClickFixLocale;
  /** Overrides the launcher side. */
  position?: "left" | "right";
  /** Overrides the accent color (#rrggbb). */
  color?: string;
  /** Overrides light/dark/auto. */
  theme?: ClickFixTheme;
  /** Layout direction; "rtl" mirrors the panel. */
  dir?: "ltr" | "rtl";
  /** Hide the bubble; open the chat from your own button (see customLauncherSelector). */
  hideLauncher?: boolean;
  /**
   * CSS selector of your own launcher(s). Elements with the
   * `data-clickfix-launcher` attribute always work; both get
   * `data-clickfix-unread` (count) and `aria-expanded`.
   */
  customLauncherSelector?: string;
  /** Stacking order of the widget (default from the widget settings). */
  zIndex?: number;
  /** Identify the user right after start (see identify). */
  user?: ClickFixIdentity;
  /** Attributes to store once the visitor has a contact (see setAttributes). */
  attributes?: ClickFixAttributes;
  /** Consent already granted by your consent manager (GDPR/KVKK). */
  consent?: boolean;
  /** Log SDK events to the console. */
  debug?: boolean;
  /**
   * false: this page never shares its screen (co-browsing) or records a
   * session replay, whatever the widget settings allow.
   */
  capture?: boolean;
  /**
   * ClickFix panel only: the signed-in member's organization slug, which
   * adds the ClickFix Assistant tab. Ignored unless the script is served
   * from the page's own origin, so it has no effect on other sites.
   */
  assistant?: { organization: string };
  /**
   * Webview bridge for native apps (docs/webview-bridge.md): the host app
   * drives the widget through `window.ClickFixBridge.receive(json)` or
   * postMessage and receives every SDK event, external links and command
   * results. `{ origin }` names the parent frame allowed to drive the
   * widget when it runs inside an iframe (never "*"). The hosted page
   * https://<app>/widget-embed.html?widget=<id> turns it on for you.
   */
  bridge?: boolean | { origin?: string };
}

export interface ClickFixCompany {
  /**
   * Your id of the company (preferred match key). It binds the contact to
   * the company only when `user_hash` signs it together with `user_id`
   * (hex(HMAC-SHA256(identity_secret, user_id + "\n" + company_id))); an
   * unsigned id is ignored and `name`/`domain` stay hints.
   */
  id?: string;
  name?: string;
  /** Company web domain, e.g. "acme.com" (second match key). */
  domain?: string;
}

/**
 * Proves the visitor is one of your signed-in users. Compute `user_hash` on
 * your server: hex(HMAC-SHA256(identity_secret, user_id)), or with the
 * user's company hex(HMAC-SHA256(identity_secret, user_id + "\n" +
 * company.id)) so the user cannot claim another company. Never ship the
 * identity secret to the browser.
 */
export interface ClickFixIdentity {
  user_id: string;
  user_hash: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: ClickFixCompany;
  /** Stored through the widget's attribute mapping (all keys allowed once verified). */
  attributes?: ClickFixAttributes;
}

export interface ClickFixProfile {
  name?: string;
  email?: string;
  phone?: string;
}

/** `update` takes profile fields, runtime overrides and attributes at once. */
export interface ClickFixUpdate extends ClickFixProfile {
  locale?: ClickFixLocale;
  theme?: ClickFixTheme;
  position?: "left" | "right";
  color?: string;
  dir?: "ltr" | "rtl";
  hideLauncher?: boolean;
  attributes?: ClickFixAttributes;
  /** Any other scalar key is treated as an attribute. */
  [attribute: string]: unknown;
}

export interface ClickFixState {
  open: boolean;
  view: "home" | "messages" | "help" | "chat" | "callback";
  /** False while page targeting (or hide()) keeps the widget off this page. */
  visible: boolean;
  hidden_reason:
    | ""
    | "device"
    | "country"
    | "hidden_page"
    | "not_listed_page"
    | "offline"
    | "hidden";
  unread: number;
  locale: ClickFixLocale;
  online: boolean;
  conversation_uuid: string | null;
  visitor_id: string;
  verified: boolean;
}

export interface ClickFixEventMap {
  /** The widget bootstrapped and rendered. */
  ready: {
    protocol_version: 1;
    sdk_version: string;
    widget_id: string;
    visitor_id: string;
  };
  open: { view?: string };
  close: Record<string, never>;
  /** The visitor moved to another tab of the panel. */
  view: { view: string };
  /** An agent (or AI agent: sender_type "bot") reply arrived. */
  message: {
    conversation_uuid: string;
    message_uuid: string;
    text: string;
    sender_type: string;
  };
  /** The visitor's message was stored. */
  "message:sent": { conversation_uuid: string; message_uuid: string };
  /** A new conversation was started (alias: "conversation:started"). */
  conversation: { conversation_uuid: string };
  "conversation:started": { conversation_uuid: string };
  /** A conversation was resolved or closed. */
  "conversation:ended": { conversation_uuid: string; status: string };
  /** Unread agent replies across the visitor's conversations changed. */
  unread: { count: number };
  /**
   * `company_verified`: the contact's company was proved by a user_hash that
   * signs `company.id` too; false when the company came only as a hint.
   */
  identify: { verified: boolean; company_verified: boolean };
  /** The CSAT survey was answered (alias: "csat"). */
  rating: { conversation_uuid: string; score: number; existing: boolean };
  csat: { conversation_uuid: string; score: number; existing: boolean };
  track: { name: string; properties?: Record<string, unknown> };
  /** A proactive message trigger fired. */
  trigger: { id: string; name: string; message: string };
  /** setAttributes result (pending: sent with the first message). */
  attributes: { applied: string[]; ignored: string[]; pending: boolean };
  consent: { granted: boolean };
  /** Page targeting changed after an SPA navigation. */
  visibility: { visible: boolean; reason: string };
  reset: Record<string, never>;
  error: { code: string; message: string };
}

export type ClickFixEvent = keyof ClickFixEventMap;
export type ClickFixHandler<E extends ClickFixEvent> = (
  payload: ClickFixEventMap[E],
) => void;

export interface ClickFixCommand {
  (command: "init" | "boot", options?: ClickFixInitOptions): void;
  (
    command:
      | "close"
      | "toggle"
      | "shutdown"
      | "show"
      | "hide"
      | "showLauncher"
      | "hideLauncher",
  ): void;
  (command: "open", view?: ClickFixView | { conversation: string }): void;
  /** Forget the visitor (call on logout); resolves once the new anonymous session exists. */
  (command: "reset"): Promise<void>;
  (command: "startReplay"): Promise<void>;
  (command: "stopCapture", revoke?: boolean): Promise<void>;
  (command: "identify", identity: ClickFixIdentity): Promise<void>;
  (
    command: "identify",
    user: Omit<ClickFixIdentity, "user_hash">,
    userHash: string,
  ): Promise<void>;
  (command: "update", update: ClickFixUpdate): Promise<void>;
  (command: "setAttributes", attributes: ClickFixAttributes): Promise<void>;
  /** Records a page event; the last 20 are attached to the visitor's next message. */
  (command: "track", name: string, properties?: Record<string, unknown>): void;
  (
    command: "startConversation" | "showNewMessage",
    message?: string,
    options?: { send?: boolean },
  ): void;
  (
    command: "showMessage",
    message: string,
    options?: { open?: boolean; sender?: string },
  ): void;
  (command: "openArticle", url: string): void;
  (command: "searchHelp", query?: string): void;
  (command: "setLocale", locale: ClickFixLocale): void;
  (command: "setTheme", theme: ClickFixTheme): void;
  (command: "consent", granted: boolean): void;
  (command: "getUnreadCount"): number;
  (command: "getVisitorId"): string;
  (command: "isOpen"): boolean;
  (command: "getState"): ClickFixState | undefined;
  <E extends ClickFixEvent>(
    command: "on" | "once",
    event: E,
    handler: ClickFixHandler<E>,
  ): void;
  <E extends ClickFixEvent>(
    command: "off",
    event: E,
    handler?: ClickFixHandler<E>,
  ): void;
}

export interface ClickFixSDK extends ClickFixCommand {
  version: string;
  init(options?: ClickFixInitOptions): void;
  /** Alias of init. */
  boot(options?: ClickFixInitOptions): void;
  open(view?: ClickFixView | { conversation: string }): void;
  close(): void;
  toggle(): void;
  /** Shows / hides the whole widget (launcher included). */
  show(): void;
  hide(): void;
  showLauncher(): void;
  hideLauncher(): void;
  identify(identity: ClickFixIdentity): Promise<void>;
  identify(
    user: Omit<ClickFixIdentity, "user_hash">,
    userHash: string,
  ): Promise<void>;
  update(update: ClickFixUpdate): Promise<void>;
  setAttributes(attributes: ClickFixAttributes): Promise<void>;
  track(name: string, properties?: Record<string, unknown>): void;
  /** Opens a new conversation; with send: true the message is sent at once. */
  startConversation(message?: string, options?: { send?: boolean }): void;
  /** Alias of startConversation (prefilled composer). */
  showNewMessage(message?: string): void;
  /** Shows a proactive message bubble above the launcher. */
  showMessage(
    message: string,
    options?: { open?: boolean; sender?: string },
  ): void;
  /** Opens a help center article (https) in a new tab. */
  openArticle(url: string): void;
  /** Opens the help tab with search results. */
  searchHelp(query?: string): void;
  setLocale(locale: ClickFixLocale): void;
  setTheme(theme: ClickFixTheme): void;
  /** Grants or withdraws consent (GDPR/KVKK); withdrawing clears stored data. */
  consent(granted: boolean): void;
  getUnreadCount(): number;
  getVisitorId(): string;
  isOpen(): boolean;
  getState(): ClickFixState | undefined;
  on<E extends ClickFixEvent>(event: E, handler: ClickFixHandler<E>): void;
  once<E extends ClickFixEvent>(event: E, handler: ClickFixHandler<E>): void;
  off<E extends ClickFixEvent>(event: E, handler?: ClickFixHandler<E>): void;
  /** Ask for consent before recording the current conversation. */
  startReplay(): Promise<void>;
  /** Stop capture; pass true to revoke consent and delete the recording. */
  stopCapture(revoke?: boolean): Promise<void>;
  /** Forget the visitor (call on logout). */
  reset(): Promise<void>;
  /** Remove the widget from the page. */
  shutdown(): void;
}

/** Host -> widget messages of the webview bridge (docs/webview-bridge.md). */
export type ClickFixBridgeCommand =
  | { type: "clickfix:identify"; id?: string; user: ClickFixIdentity }
  | {
      type: "clickfix:track";
      id?: string;
      name: string;
      properties?: Record<string, unknown>;
    }
  | {
      type: "clickfix:open";
      id?: string;
      view?: ClickFixView;
      conversation?: string;
    }
  | { type: "clickfix:close"; id?: string }
  | { type: "clickfix:update"; id?: string; update: ClickFixUpdate }
  | { type: "clickfix:consent"; id?: string; granted: boolean }
  | { type: "clickfix:reset"; id?: string }
  | { type: "clickfix:get-state"; id?: string }
  /** Continue the session the app started natively (@getclickfix/visitor-core). */
  | { type: "clickfix:session"; id?: string; token: string };

/** Widget -> host messages of the webview bridge. */
export type ClickFixBridgeMessage =
  | ({ type: "clickfix:ready"; bridge_version: 1 } & ClickFixEventMap["ready"])
  | {
      [E in ClickFixEvent]: {
        type: "clickfix:event";
        event: E;
        payload: ClickFixEventMap[E];
      };
    }[ClickFixEvent]
  | { type: "clickfix:link"; url: string }
  | {
      type: "clickfix:result";
      id: string;
      ok: boolean;
      data?: unknown;
      error?: { code: string; message: string };
    }
  /** The webview's visitor token after ready, identify and reset. */
  | { type: "clickfix:session"; token: string; visitor_id: string };

export interface ClickFixBridge {
  version: 1;
  /** Detected host transport, or null when no host object was found. */
  transport: "react-native" | "ios" | "android" | "flutter" | "frame" | null;
  /** Entry point for the host app: a JSON string or an object. */
  receive(message: string | ClickFixBridgeCommand): Promise<void>;
}

declare global {
  interface Window {
    ClickFix: ClickFixSDK;
    /** Present only while the webview bridge is on. */
    ClickFixBridge?: ClickFixBridge;
  }
}
