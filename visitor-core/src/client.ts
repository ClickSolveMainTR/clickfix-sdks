// The visitor API client (CF-201): everything the ClickFix widget does over
// HTTP, without a UI and without a DOM. Browsers use it through the app's
// same-origin BFF (`/api/v1/widget/*`, the page origin is the credential);
// native apps use it with a mobile app key (`X-ClickFix-App-Key` +
// `X-ClickFix-App-Package`) against the app's absolute URL. Everything else
// (visitor token, user_hash, rate limits, payloads) is identical.
import type { components } from './schema.js';
import {
  defaultFetch,
  defaultFormData,
  randomUUID as defaultRandomUUID,
  sleep,
  type AbortSignalLike,
  type FetchLike,
  type FileInput,
  type FormDataCtor,
  type ResponseLike,
} from './env.js';

type S = components['schemas'];
export type Bootstrap = S['WidgetBootstrap'];
export type Visitor = S['WidgetVisitor'];
export type Conversation = S['WidgetConversation'];
export type MessagePage = S['WidgetMessagePage'];
export type SendInput = S['WidgetSendInput'];
export type Sent = S['WidgetSent'];
export type IdentifyInput = S['WidgetIdentifyInput'];
export type ProfileInput = S['WidgetProfileInput'];
export type AttributesInput = S['WidgetAttributesInput'];
export type AttributesResult = S['EnvelopeWidgetAttributes']['data'];
export type RealtimeToken = S['WidgetRealtimeToken'];
export type Rating = S['WidgetRating'];
export type BootstrapInput = S['WidgetBootstrapInput'];
export type HelpResult = S['EnvelopeWidgetHelp']['data'];
export type TrackedEvent = NonNullable<SendInput['events']>[number];

/** Version reported to the API in bootstrap (`sdk_version`). */
export const CORE_VERSION = 'core-0.1.0';

/** Code of a 401 whose visitor token is missing, expired or foreign. */
export const TOKEN_INVALID = 'WIDGET_VISITOR_TOKEN_INVALID';

/** How many `track` events ride along with the next message. */
export const MAX_TRACKED_EVENTS = 20;

export class VisitorError extends Error {
  constructor(
    public status: number,
    public code: string,
    public requestId: string | null = null,
  ) {
    super(`ClickFix visitor API ${status}: ${code}`);
    this.name = 'VisitorError';
  }
}

/** A failed fetch (no response at all): offline, DNS, TLS. */
export function isNetworkError(err: unknown): boolean {
  return !(err instanceof VisitorError) && err instanceof Error && err.message !== 'aborted';
}

export interface AppIdentity {
  /** Mobile app key created in the widget's "Mobile apps" settings. */
  key: string;
  /** The app's bundle id (iOS) or application id (Android). */
  packageName: string;
}

export interface VisitorClientOptions {
  publicId: string;
  /**
   * API prefix. Browser mode: the same-origin BFF, default `/api`. App mode:
   * the ClickFix app's absolute URL plus `/api`, e.g. `https://support.example.com/api`.
   */
  baseURL?: string;
  /** `browser` (default): the page origin is the credential. `app`: `app` key headers. */
  mode?: 'browser' | 'app';
  app?: AppIdentity;
  fetch?: FetchLike;
  FormData?: FormDataCtor;
  /** A previously persisted visitor token (resume). */
  token?: string;
  /** Called with every token change (persist it with your own storage policy; "" clears). */
  onToken?: (token: string) => void;
  /** Total attempts for retryable requests (GET, idempotent sends); default 3, at most 5. */
  attempts?: number;
  baseDelayMs?: number;
  /** Screen/page the visitor is on; sent as `page_url` with bootstrap and messages. */
  screen?: string;
  /** Two-letter language of the device, sent with bootstrap. */
  language?: string;
  randomUUID?: () => string;
}

export interface Session {
  bootstrap: Bootstrap | null;
  visitor: Visitor | null;
}

export interface RequestOptions {
  signal?: AbortSignalLike;
  /** Retry on network errors and 429/502/503/504 (the request is idempotent). */
  retry?: boolean;
  /** Renew the visitor session once when the token is rejected (default true). */
  renew?: boolean;
}

export interface ScreenContext {
  /** Current screen or page (`page_url` of the next message). */
  screen?: string;
}

const RETRY_STATUS = [429, 502, 503, 504];

/** Create once per visitor. No global storage, DOM access or shared user state. */
export function createVisitorClient(options: VisitorClientOptions) {
  const mode = options.mode ?? 'browser';
  if (mode === 'app' && !(options.app?.key && options.app.packageName))
    throw new Error('app mode needs app.key and app.packageName');
  if (mode === 'app' && !/^https?:\/\//.test(options.baseURL ?? ''))
    throw new Error('app mode needs an absolute baseURL (https://<app>/api)');
  const transport = options.fetch ?? defaultFetch();
  const uuid = options.randomUUID ?? defaultRandomUUID;
  const base = `${(options.baseURL ?? '/api').replace(/\/$/, '')}/v1/widget/${encodeURIComponent(options.publicId)}`;
  const attempts = Math.min(Math.max(Math.trunc(options.attempts ?? 3), 1), 5);
  const baseDelay = options.baseDelayMs ?? 250;

  let token = options.token ?? '';
  let session: Session = { bootstrap: null, visitor: null };
  let screen = options.screen ?? '';
  let events: TrackedEvent[] = [];
  const listeners = new Set<() => void>();
  let generation = 0;
  let renewing: Promise<void> | null = null;

  const notify = () => {
    for (const fn of listeners) fn();
  };
  const setToken = (next: string) => {
    if (next === token) return;
    token = next;
    options.onToken?.(token);
  };
  const save = (visitor: Visitor, bootstrap: Bootstrap | null) => {
    setToken(visitor.token);
    session = { visitor, bootstrap: bootstrap ?? session.bootstrap };
    notify();
  };
  const part = (s: string) => encodeURIComponent(s);
  // Form-encoded query values (spaces as "+", like the browser's search
  // params class, which not every runtime ships).
  const q = (s: string) => encodeURIComponent(s).replace(/%20/g, '+');

  async function once<T>(path: string, method: string, body: unknown, signal?: AbortSignalLike): Promise<{ res: ResponseLike; data?: T; code: string; requestId: string | null }> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (mode === 'app' && options.app) {
      headers['X-ClickFix-App-Key'] = options.app.key;
      headers['X-ClickFix-App-Package'] = options.app.packageName;
    }
    const multipart = isFormData(body);
    if (body !== undefined && !multipart) headers['Content-Type'] = 'application/json';
    const res = await transport(base + path, {
      method,
      headers,
      body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
      signal,
      credentials: 'omit',
      redirect: 'error',
    });
    let json: { data?: T; error?: { code?: string }; meta?: { request_id?: string } } = {};
    try {
      json = (await res.json()) as typeof json;
    } catch {
      json = {};
    }
    return { res, data: json.data, code: json.error?.code ?? 'HTTP_ERROR', requestId: json.meta?.request_id ?? res.headers.get('X-Request-ID') };
  }

  /**
   * One API call with bounded retries (idempotent requests only) and one
   * session renewal: when the token is rejected, bootstrap is called (an
   * expired token resumes the same visitor for 90 days) and the request is
   * repeated with the new token.
   */
  async function request<T>(path: string, method = 'GET', body?: unknown, opts: RequestOptions = {}): Promise<T> {
    const retry = opts.retry ?? method === 'GET';
    const limit = retry ? attempts : 1;
    for (let attempt = 0; ; attempt++) {
      let out: Awaited<ReturnType<typeof once<T>>>;
      try {
        out = await once<T>(path, method, body, opts.signal);
      } catch (err) {
        if (attempt + 1 >= limit || opts.signal?.aborted) throw err;
        await sleep(Math.min(baseDelay * 2 ** attempt, 30000), opts.signal);
        continue;
      }
      if (out.res.ok) return out.data as T;
      if (RETRY_STATUS.includes(out.res.status) && attempt + 1 < limit) {
        const after = out.res.headers.get('Retry-After');
        let wait = Math.min(baseDelay * 2 ** attempt, 30000);
        if (after !== null) {
          const n = Number(after);
          const ms = Number.isFinite(n) ? n * 1000 : Date.parse(after) - Date.now();
          if (Number.isFinite(ms)) wait = Math.min(Math.max(ms, 0), 30000);
        }
        await sleep(wait, opts.signal);
        continue;
      }
      if (out.res.status === 401 && out.code === TOKEN_INVALID && (opts.renew ?? true) && path !== '/bootstrap') {
        const before = token;
        await renew(opts.signal);
        if (token !== before) return request<T>(path, method, body, { ...opts, renew: false });
      }
      throw new VisitorError(out.res.status, out.code, out.requestId);
    }
  }

  /** Bootstrap again (deduplicated across concurrent failures). */
  function renew(signal?: AbortSignalLike): Promise<void> {
    renewing ??= bootstrap(signal)
      .then(() => undefined)
      .finally(() => {
        renewing = null;
      });
    return renewing;
  }

  function bootstrapBody(): BootstrapInput {
    const body: BootstrapInput = { sdk_version: CORE_VERSION };
    if (screen) body.page_url = screen.slice(0, 2000);
    if (options.language) body.language = options.language.slice(0, 2);
    return body;
  }

  async function bootstrap(signal?: AbortSignalLike): Promise<Bootstrap> {
    const current = ++generation;
    const out = await request<Bootstrap>('/bootstrap', 'POST', bootstrapBody(), { signal, retry: true, renew: false });
    if (current === generation) save(out.visitor, out);
    return out;
  }

  const send = (path: string, input: SendInput, file?: FileInput, signal?: AbortSignalLike) => {
    const body: SendInput = { ...input, client_id: input.client_id ?? uuid() };
    if (!body.page_url && screen) body.page_url = screen.slice(0, 2000);
    if (!body.events && events.length) body.events = events.slice(-MAX_TRACKED_EVENTS);
    const done = (out: Sent) => {
      events = [];
      return out;
    };
    if (!file) return request<Sent>(path, 'POST', body, { signal, retry: true }).then(done);
    const Form = options.FormData ?? defaultFormData();
    const form = new Form();
    appendFile(form, file);
    // The multipart API accepts these fields; structured events/profile are JSON-only.
    for (const key of ['text', 'client_id', 'name', 'email', 'page_url', 'phone', 'intent'] as const)
      if (body[key] !== undefined && body[key] !== '') form.append(key, String(body[key]));
    if (body.form) form.append('form', JSON.stringify(body.form));
    if (body.attributes) form.append('attributes', JSON.stringify(body.attributes));
    if (body.consent !== undefined) form.append('consent', body.consent ? 'true' : 'false');
    return request<Sent>(path, 'POST', form, { signal, retry: true }).then(done);
  };

  return {
    /** `useSyncExternalStore`-compatible subscription to the session. */
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getSnapshot: (): Session => session,
    /** The current visitor token ("" before init). Hand it to a webview with `clickfix:session`. */
    getToken: () => token,
    /** Continue a session another surface started (webview → app handover). */
    adoptToken(next: string) {
      generation++;
      setToken(next);
      session = { bootstrap: null, visitor: null };
      notify();
    },
    /** Start or resume the visitor session. */
    init: (signal?: AbortSignalLike) => bootstrap(signal),
    /** user_hash must come from your server's HMAC-SHA256 helper. */
    async identify(input: IdentifyInput, signal?: AbortSignalLike) {
      const current = ++generation;
      const out = await request<Visitor>('/identify', 'POST', input, { signal });
      if (current === generation) save(out, null);
      return out;
    },
    /** Forget the visitor (logout): the next init is a stranger. */
    reset() {
      generation++;
      setToken('');
      session = { bootstrap: null, visitor: null };
      events = [];
      notify();
    },
    /** Record an app event; the next message carries the last 20. */
    track(name: string, properties?: Record<string, unknown>) {
      const event: TrackedEvent = { name: String(name).slice(0, 100), at: new Date().toISOString() };
      if (properties) event.properties = properties;
      events = [...events, event].slice(-MAX_TRACKED_EVENTS);
    },
    /** Set the screen the visitor is on (page_url of bootstrap and messages). */
    setScreen(next: string) {
      screen = next;
    },
    /** Pending tracked events (newest last). */
    pendingEvents: (): readonly TrackedEvent[] => events,
    conversations: (signal?: AbortSignalLike) => request<{ items: Conversation[] }>('/conversations', 'GET', undefined, { signal }),
    messages: (conversation: string, cursor: { before?: string; after?: string } = {}, signal?: AbortSignalLike) => {
      const query: string[] = [];
      if (cursor.before) query.push(`before=${q(cursor.before)}`);
      if (cursor.after) query.push(`after=${q(cursor.after)}`);
      return request<MessagePage>(`/conversations/${part(conversation)}/messages?${query.join('&')}`, 'GET', undefined, { signal });
    },
    createConversation: (input: SendInput, file?: FileInput, signal?: AbortSignalLike) => send('/conversations', input, file, signal),
    sendMessage: (conversation: string, input: SendInput, file?: FileInput, signal?: AbortSignalLike) =>
      send(`/conversations/${part(conversation)}/messages`, input, file, signal),
    typing: (conversation: string, typing: boolean, signal?: AbortSignalLike) =>
      request<{ typing: boolean }>(`/conversations/${part(conversation)}/typing`, 'POST', { typing }, { signal }),
    markRead: (conversation: string, signal?: AbortSignalLike) =>
      request<{ updated: number }>(`/conversations/${part(conversation)}/read`, 'POST', undefined, { signal, retry: true }),
    helpSearch: (query: string, locale: 'tr' | 'en' = 'tr', signal?: AbortSignalLike) =>
      request<HelpResult>(`/help/search?q=${q(query)}&locale=${locale}`, 'GET', undefined, { signal }),
    realtimeToken: (signal?: AbortSignalLike) => request<RealtimeToken>('/realtime-token', 'POST', undefined, { signal, retry: true }),
    rate: (conversation: string, score: number, comment = '', signal?: AbortSignalLike) =>
      request<Rating>(`/conversations/${part(conversation)}/rating`, 'POST', { score, comment }, { signal }),
    async updateProfile(input: ProfileInput, signal?: AbortSignalLike) {
      const current = ++generation;
      const out = await request<Visitor>('/profile', 'PATCH', input, { signal });
      if (current === generation) save(out, null);
      return out;
    },
    /** Custom fields and mapped attributes (CF-196). */
    setAttributes: (attributes: AttributesInput['attributes'], signal?: AbortSignalLike) =>
      request<AttributesResult>('/attributes', 'PATCH', { attributes }, { signal, retry: true }),
    /** Raw access for routes the core does not wrap (same retries and renewal). */
    request,
  };
}

export type VisitorClient = ReturnType<typeof createVisitorClient>;

function isFormData(body: unknown): body is object {
  return typeof body === 'object' && body !== null && typeof (body as { append?: unknown }).append === 'function';
}

function appendFile(form: { append(name: string, value: unknown, filename?: string): void }, file: FileInput) {
  if ('uri' in file) {
    // React Native: FormData takes {uri,name,type} descriptors.
    form.append('file', file);
    return;
  }
  const name = file.name;
  if (name) form.append('file', file, name);
  else form.append('file', file);
}
