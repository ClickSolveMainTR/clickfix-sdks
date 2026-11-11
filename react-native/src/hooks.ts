// Hooks (CF-202). Every hook reads the provider's client; nothing here
// touches the DOM. Lists refresh on realtime pushes, on app foreground and,
// while the socket is down, by polling (4 s in an open conversation).
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AttributesInput,
  Conversation,
  FileInput,
  HelpResult,
  IdentifyInput,
  MessagePage,
  ProfileInput,
  Rating,
  SendInput,
  Sent,
} from '@getclickfix/visitor-core';
import { ClickFixContext, type ClickFixContextValue, type RealtimeEvent } from './context.js';

export type Message = MessagePage['items'][number];

/** The provider's value: client, session, status, realtime state. */
export function useClickFix(): ClickFixContextValue {
  const ctx = useContext(ClickFixContext);
  if (!ctx) throw new Error('useClickFix must be used inside <ClickFixProvider>');
  return ctx;
}

export interface IdentifyOptions {
  /** The user's id in your system (the contact's external id). */
  userId: string;
  /** Server-computed HMAC; omitted when the provider has `getUserHash`. */
  userHash?: string;
  name?: string;
  email?: string;
  phone?: string;
  /** `id` is the company's external id; it binds only when `userHash` signs it too (CF-206). */
  company?: { id?: string; name?: string; domain?: string };
}

/** Identity, profile, custom fields and screen/event context. */
export function useVisitor() {
  const { client, session, status, error, getUserHash } = useClickFix();
  const identify = useCallback(
    async (input: IdentifyOptions) => {
      let hash = input.userHash;
      if (!hash) {
        if (!getUserHash) throw new Error('identify needs userHash or ClickFixProvider.getUserHash');
        hash = await getUserHash(input.userId, input.company?.id);
      }
      const body: IdentifyInput = { user_id: input.userId, user_hash: hash };
      if (input.name) body.name = input.name;
      if (input.email) body.email = input.email;
      if (input.phone) body.phone = input.phone;
      if (input.company) body.company = input.company;
      return client.identify(body);
    },
    [client, getUserHash],
  );
  const reset = useCallback(async () => {
    client.reset();
    await client.init();
  }, [client]);
  return {
    visitor: session.visitor,
    bootstrap: session.bootstrap,
    status,
    error,
    /** True after `identify` with a valid `user_hash`. */
    verified: session.visitor?.verified ?? false,
    identify,
    /** Forget the visitor (logout) and start a stranger's session. */
    reset,
    updateProfile: useCallback((input: ProfileInput) => client.updateProfile(input), [client]),
    /** Custom fields and mapped attributes; unknown keys are reported in `ignored`. */
    setAttributes: useCallback((attributes: AttributesInput['attributes']) => client.setAttributes(attributes), [client]),
    /** Record an app event; the next message carries the last 20. */
    track: client.track,
    /** The screen the visitor is on (`page_url` of the next message). */
    setScreen: client.setScreen,
  };
}

function useRealtime(handler: (event: RealtimeEvent) => void) {
  const { subscribe } = useClickFix();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => subscribe((event) => ref.current(event)), [subscribe]);
}

const sameConversation = (event: RealtimeEvent, uuid: string | null) => !event.conversation_uuid || event.conversation_uuid === uuid;

/** The visitor's conversations (from bootstrap, then refreshed on every change). */
export function useConversations() {
  const { client, session, status } = useClickFix();
  const [items, setItems] = useState<Conversation[]>(session.bootstrap?.conversations ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const ready = status === 'ready';
  const visitorId = session.visitor?.id ?? null;
  const generation = useRef(0);
  const abort = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      generation.current++;
      abort.current?.abort();
    },
    [],
  );

  const reload = useCallback(async () => {
    const current = ++generation.current;
    abort.current?.abort();
    const controller = (abort.current = new AbortController());
    setLoading(true);
    try {
      const out = await client.conversations(controller.signal);
      if (current === generation.current) {
        setItems(out.items);
        setError(null);
      }
    } catch (err) {
      if (current === generation.current) setError(err);
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [client]);

  // Bootstrap already lists the conversations; identify/reset change the visitor.
  useEffect(() => {
    if (session.bootstrap) setItems(session.bootstrap.conversations);
  }, [session.bootstrap]);
  const first = useRef(true);
  useEffect(() => {
    if (!ready || !visitorId) return;
    if (first.current) {
      first.current = false;
      return;
    }
    void reload();
  }, [ready, visitorId, reload]);
  useRealtime((event) => {
    if (ready && ['message.created', 'conversation.updated', 'app.foreground'].includes(event.type)) void reload();
  });

  const create = useCallback(
    (input: string | SendInput, file?: FileInput) => client.createConversation(typeof input === 'string' ? { text: input } : input, file).then((sent) => {
      void reload();
      return sent;
    }),
    [client, reload],
  );
  return { items, loading, error, reload, create };
}

export interface ConversationOptions {
  /** Poll interval while the realtime socket is down (ms, default 4000; 0 disables). */
  pollMs?: number;
  /** Poll interval while connected (ms, default 30000; 0 disables). */
  livePollMs?: number;
}

/**
 * One conversation: its messages (oldest first), sending (text and/or one
 * file), typing, read receipts and the agent's typing indicator. Pass `null`
 * for a new conversation: the first `send` creates it and `uuid` is set.
 */
export function useConversation(initial: string | null, options: ConversationOptions = {}) {
  const { client, status, connected } = useClickFix();
  const [uuid, setUuid] = useState(initial);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(Boolean(initial));
  const [error, setError] = useState<unknown>(null);
  const [agentTyping, setAgentTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingSentAt = useRef(0);
  const latest = useRef<Message[]>([]);
  latest.current = messages;
  const ready = status === 'ready';
  const generation = useRef(0);
  const abort = useRef<AbortController>(new AbortController());

  useEffect(() => {
    generation.current++;
    abort.current.abort();
    abort.current = new AbortController();
    setUuid(initial);
    setConversation(null);
    setMessages([]);
    setHasMore(false);
    setLoading(Boolean(initial));
    setError(null);
    setAgentTyping(false);
  }, [initial]);

  const merge = (prev: Message[], next: Message[]) => {
    const seen = new Set(prev.map((m) => m.uuid));
    return [...prev, ...next.filter((m) => !seen.has(m.uuid))];
  };

  const apply = useCallback((page: MessagePage, mode: 'replace' | 'append' | 'prepend') => {
    setConversation(page.conversation);
    if (mode === 'replace') {
      setMessages(page.items);
      setHasMore(page.has_more);
    } else if (mode === 'append') setMessages((prev) => merge(prev, page.items));
    else {
      setMessages((prev) => merge(page.items, prev));
      setHasMore(page.has_more);
    }
  }, []);

  /** Newest page, or only what arrived after the last known message. */
  const refresh = useCallback(
    async (full = false) => {
      if (!uuid || !ready) return;
      const current = generation.current;
      const last = latest.current.at(-1);
      try {
        const page = await client.messages(uuid, full || !last ? {} : { after: last.uuid }, abort.current.signal);
        if (current !== generation.current) return;
        apply(page, full || !last ? 'replace' : 'append');
        setError(null);
        if (page.items.some((m) => m.direction === 'out')) setAgentTyping(false);
      } catch (err) {
        if (current === generation.current) setError(err);
      } finally {
        if (current === generation.current) setLoading(false);
      }
    },
    [client, uuid, ready, apply],
  );

  useEffect(() => {
    void refresh(true);
  }, [refresh]);

  useRealtime((event) => {
    if (!uuid || !sameConversation(event, uuid)) return;
    if (event.type === 'typing') {
      setAgentTyping(Boolean(event.typing));
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (event.typing) typingTimer.current = setTimeout(() => setAgentTyping(false), 8000);
      return;
    }
    if (['message.created', 'conversation.updated', 'app.foreground'].includes(event.type)) void refresh();
  });

  const interval = connected ? (options.livePollMs ?? 30000) : (options.pollMs ?? 4000);
  useEffect(() => {
    if (!uuid || !ready || interval <= 0) return;
    const id = setInterval(() => void refresh(), interval);
    return () => clearInterval(id);
  }, [uuid, ready, interval, refresh]);
  useEffect(
    () => () => {
      generation.current++;
      abort.current.abort();
      if (typingTimer.current) clearTimeout(typingTimer.current);
    },
    [],
  );

  const loadMore = useCallback(async () => {
    const oldest = latest.current[0];
    if (!uuid || !oldest || !hasMore) return;
    const current = generation.current;
    const page = await client.messages(uuid, { before: oldest.uuid }, abort.current.signal);
    if (current === generation.current) apply(page, 'prepend');
  }, [client, uuid, hasMore, apply]);

  const send = useCallback(
    async (input: string | SendInput, file?: FileInput): Promise<Sent> => {
      const body = typeof input === 'string' ? { text: input } : input;
      const sent = uuid ? await client.sendMessage(uuid, body, file) : await client.createConversation(body, file);
      setUuid(sent.conversation_uuid);
      setMessages((prev) => merge(prev, [sent.message]));
      typingSentAt.current = 0;
      return sent;
    },
    [client, uuid],
  );

  /** Call with true while the visitor types (rate-limited to one call per 3 s) and false when they stop. */
  const setTyping = useCallback(
    async (typing: boolean) => {
      if (!uuid) return;
      const now = Date.now();
      if (typing && now - typingSentAt.current < 3000) return;
      typingSentAt.current = typing ? now : 0;
      await client.typing(uuid, typing).catch(() => undefined);
    },
    [client, uuid],
  );

  const markRead = useCallback(async () => {
    if (!uuid) return;
    await client.markRead(uuid).catch(() => undefined);
    setMessages((prev) => prev.map((m) => (m.direction === 'out' && !m.read_at ? { ...m, read_at: new Date().toISOString() } : m)));
  }, [client, uuid]);

  const unread = useMemo(() => messages.filter((m) => m.direction === 'out' && !m.read_at).length, [messages]);

  return { uuid, conversation, messages, loading, error, hasMore, loadMore, send, setTyping, markRead, agentTyping, unread, reload: () => refresh(true) };
}

/** Help center search (empty query: no request). */
export function useHelpSearch(query: string, locale: 'tr' | 'en' = 'tr', options: { debounceMs?: number } = {}) {
  const { client, status } = useClickFix();
  const [result, setResult] = useState<HelpResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const q = query.trim();
  const ready = status === 'ready';
  useEffect(() => {
    if (!q || !ready) {
      setResult(null);
      setLoading(false);
      return;
    }
    let live = true;
    const controller = new AbortController();
    setLoading(true);
    const id = setTimeout(() => {
      client.helpSearch(q, locale, controller.signal).then(
        (out) => {
          if (!live) return;
          setResult(out);
          setError(null);
          setLoading(false);
        },
        (err: unknown) => {
          if (!live) return;
          setError(err);
          setLoading(false);
        },
      );
    }, options.debounceMs ?? 300);
    return () => {
      live = false;
      clearTimeout(id);
      controller.abort();
    };
  }, [client, q, locale, ready, options.debounceMs]);
  return { result, loading, error };
}

/** Rate a resolved conversation (1-5 and an optional comment). */
export function useRating(conversation: string | null) {
  const { client } = useClickFix();
  const [rating, setRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const submit = useCallback(
    async (score: number, comment = '') => {
      if (!conversation) throw new Error('no conversation to rate');
      setLoading(true);
      try {
        const out = await client.rate(conversation, score, comment);
        setRating(out);
        setError(null);
        return out;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, conversation],
  );
  return { rating, loading, error, submit };
}
