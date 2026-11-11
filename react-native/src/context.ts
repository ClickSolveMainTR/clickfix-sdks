import { createContext } from 'react';
import type { Session, VisitorClient } from '@getclickfix/visitor-core';

export type ClickFixStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * One push on the visitor's realtime channel (`message.created`,
 * `conversation.updated`, `typing`, ...) or the synthetic `app.foreground`
 * the provider emits when the app returns to the foreground.
 */
export interface RealtimeEvent {
  type: string;
  conversation_uuid?: string;
  typing?: boolean;
  [key: string]: unknown;
}

/** Computes `user_hash` on your server: `hex(HMAC-SHA256(secret, userId))`, or `userId + "\n" + companyId` with a company. */
export type GetUserHash = (userId: string, companyId?: string) => Promise<string>;

export interface ClickFixContextValue {
  client: VisitorClient;
  widgetId: string;
  session: Session;
  status: ClickFixStatus;
  error: unknown;
  /** Realtime channel connected (false while polling). */
  connected: boolean;
  /** Start or restart the visitor session (bootstrap). */
  init(): Promise<void>;
  /** Realtime events of this visitor; returns the unsubscribe function. */
  subscribe(listener: (event: RealtimeEvent) => void): () => void;
  getUserHash?: GetUserHash;
}

export const ClickFixContext = createContext<ClickFixContextValue | null>(null);
