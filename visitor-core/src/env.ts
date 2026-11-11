// Runtime facade of the core. The package compiles against lib ES2022 only
// (no DOM types), so everything the host runtime provides (fetch, FormData,
// WebSocket, timers, random ids) is typed structurally here and read from
// globalThis at call time. React Native (Hermes), Node 22+ and browsers all
// satisfy these shapes; a host may inject its own implementations.

export interface AbortSignalLike {
  readonly aborted: boolean;
  addEventListener?(type: 'abort', listener: () => void): void;
  removeEventListener?(type: 'abort', listener: () => void): void;
}

export interface HeadersLike {
  get(name: string): string | null;
}

export interface ResponseLike {
  readonly ok: boolean;
  readonly status: number;
  readonly headers: HeadersLike;
  json(): Promise<unknown>;
  text?(): Promise<string>;
  body?: { cancel?(): Promise<void> | void } | null;
}

export interface RequestInitLike {
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  signal?: AbortSignalLike;
  credentials?: 'omit';
  redirect?: 'error';
}

export type FetchLike = (url: string, init: RequestInitLike) => Promise<ResponseLike>;

/** A file as a Blob/File (browser, Node) or a React Native file descriptor. */
export interface BlobLike {
  readonly size: number;
  readonly type: string;
  readonly name?: string;
}
export interface NativeFile {
  uri: string;
  name: string;
  type: string;
}
export type FileInput = BlobLike | NativeFile;

export interface FormDataLike {
  set?(name: string, value: unknown, filename?: string): void;
  append(name: string, value: unknown, filename?: string): void;
  get?(name: string): unknown;
}
export type FormDataCtor = new () => FormDataLike;

export interface WebSocketLike {
  onopen: ((ev?: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  onclose: ((ev?: unknown) => void) | null;
  onerror: ((ev?: unknown) => void) | null;
  send(data: string): void;
  close(): void;
}
export type WebSocketCtor = new (url: string) => WebSocketLike;

type Timer = { setTimeout(fn: () => void, ms: number): unknown; clearTimeout(id: unknown): void };

const g = globalThis as unknown as {
  fetch?: FetchLike;
  FormData?: FormDataCtor;
  WebSocket?: WebSocketCtor;
  crypto?: { randomUUID?: () => string; getRandomValues?: (a: Uint8Array) => Uint8Array };
} & Timer;

export function defaultFetch(): FetchLike {
  if (typeof g.fetch !== 'function') throw new Error('fetch is not available; pass options.fetch');
  // Bound so hosts whose fetch checks `this` (browsers) keep working.
  return (url, init) => g.fetch!.call(globalThis, url, init);
}

export function defaultFormData(): FormDataCtor {
  if (typeof g.FormData !== 'function') throw new Error('FormData is not available; pass options.FormData');
  return g.FormData;
}

export function defaultWebSocket(): WebSocketCtor | null {
  return typeof g.WebSocket === 'function' ? g.WebSocket : null;
}

export const timers: Timer = {
  setTimeout: (fn, ms) => g.setTimeout(fn, ms),
  clearTimeout: (id) => g.clearTimeout(id),
};

/** A v4 UUID: crypto.randomUUID when the runtime has it (Node, browsers,
 * newer Hermes), else getRandomValues, else Math.random (the id only makes
 * retries idempotent; it is not a secret). */
export function randomUUID(): string {
  if (typeof g.crypto?.randomUUID === 'function') return g.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof g.crypto?.getRandomValues === 'function') g.crypto.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function sleep(ms: number, signal?: AbortSignalLike): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('aborted'));
    const id = timers.setTimeout(() => {
      signal?.removeEventListener?.('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      timers.clearTimeout(id);
      reject(new Error('aborted'));
    };
    signal?.addEventListener?.('abort', onAbort);
  });
}
