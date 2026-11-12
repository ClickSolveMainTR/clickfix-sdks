// An in-memory widget API behind `fetch` (tests): the routes the
// hooks use, with the shapes of backend/docs/openapi.yaml (/v1/widget/*).
// Nothing is networked; the same stub stands in for the Expo package tests.
import type { FetchLike } from '@getclickfix/visitor-core';

export interface StubMessage {
  uuid: string;
  direction: 'in' | 'out';
  sender_type: string;
  sender_name: string;
  kind: string;
  content: string;
  status: string;
  client_id: string | null;
  attachments: { uuid: string; filename: string; content_type: string; size_bytes: number; url: string }[];
  created_at: string;
  read_at: string | null;
}
interface StubConversation {
  uuid: string;
  number: number;
  status: 'open' | 'resolved';
  open: boolean;
  last_message_preview: string;
  last_message_direction: string;
  last_message_at: string;
  unread_count: number;
  can_rate: boolean;
  rating: number | null;
  created_at: string;
  resolved_at: string | null;
  messages: StubMessage[];
}

export interface StubCall {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: unknown;
}

interface RNFormData {
  getParts(): { fieldName: string; string?: string; uri?: string; name?: string; type?: string }[];
}
/** React Native's FormData parts as a plain object (text fields as strings, the file as its descriptor). */
function formBody(form: RNFormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const part of form.getParts()) out[part.fieldName] = part.uri ? { uri: part.uri, name: part.name, type: part.type } : part.string;
  return out;
}

interface StubVisitor {
  id: string;
  token: string;
  identified: Record<string, unknown> | null;
}

export function createStub(options: { realtime?: boolean; requestForm?: boolean; knownTokens?: string[] } = {}) {
  const calls: StubCall[] = [];
  const conversations: StubConversation[] = [];
  let seq = 0;
  const visitors = new Map<string, StubVisitor>();
  for (const t of options.knownTokens ?? []) visitors.set(t, { id: `v-${visitors.size + 1}`, token: t, identified: null });
  let current: StubVisitor = visitors.values().next().value ?? { id: 'v-0', token: '', identified: null };
  const newVisitor = () => {
    const n = visitors.size + 1;
    current = { id: `v-${n}`, token: `tok-${n}`, identified: null };
    visitors.set(current.token, current);
  };
  const id = (p: string) => `${p}-${++seq}`;
  const now = () => new Date(Date.now() + seq).toISOString();
  const visitorBody = () => {
    const identified = current.identified;
    return {
      id: current.id,
      token: current.token,
      expires_at: '2030-01-01T00:00:00Z',
      verified: identified !== null,
      company_verified: Boolean(identified && (identified as { company?: { id?: string } }).company?.id),
      contact: identified ? { name: String(identified.name ?? 'User'), email: (identified.email as string) ?? null, phone: null } : null,
    };
  };
  const summary = (c: StubConversation) => {
    const { messages, ...rest } = c;
    void messages;
    return rest;
  };
  const addMessage = (c: StubConversation, direction: 'in' | 'out', content: string, extra: Partial<StubMessage> = {}): StubMessage => {
    const m: StubMessage = {
      uuid: id('m'),
      direction,
      sender_type: direction === 'in' ? 'contact' : 'user',
      sender_name: direction === 'in' ? 'Visitor' : 'Agent',
      kind: extra.attachments?.length ? 'media' : 'text',
      content,
      status: 'sent',
      client_id: extra.client_id ?? null,
      attachments: extra.attachments ?? [],
      created_at: now(),
      read_at: null,
    };
    c.messages.push(m);
    c.last_message_preview = content;
    c.last_message_direction = direction;
    c.last_message_at = m.created_at;
    if (direction === 'out') c.unread_count++;
    return m;
  };
  const createConversation = (): StubConversation => {
    const c: StubConversation = {
      uuid: id('c'),
      number: conversations.length + 1,
      status: 'open',
      open: true,
      last_message_preview: '',
      last_message_direction: 'in',
      last_message_at: now(),
      unread_count: 0,
      can_rate: false,
      rating: null,
      created_at: now(),
      resolved_at: null,
      messages: [],
    };
    conversations.push(c);
    return c;
  };
  const json = (data: unknown, status = 200, code = 'DENIED') =>
    new Response(JSON.stringify(status < 400 ? { success: true, data, meta: { request_id: 'req' } } : { success: false, error: { code, message: code }, meta: { request_id: 'req' } }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  const fetch: FetchLike = async (url, init) => {
    const u = url.replace(/^https?:\/\/[^/]+\/api\/v1\/widget\/[^/]+/, '');
    const [path, query = ''] = u.split('?');
    const params = Object.fromEntries(query.split('&').filter(Boolean).map((p) => p.split('=').map(decodeURIComponent) as [string, string]));
    const headers = init.headers;
    const multipart = typeof init.body === 'object' && init.body !== null && typeof (init.body as { getParts?: unknown }).getParts === 'function';
    const body = multipart ? formBody(init.body as RNFormData) : init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method: init.method, path: path ?? '', headers, body });
    if (headers['X-ClickFix-App-Key'] !== 'cf_app_test' || headers['X-ClickFix-App-Package'] !== 'com.example.app') return json({}, 403, 'WIDGET_APP_KEY_INVALID');
    const auth = headers.Authorization?.replace('Bearer ', '') ?? '';
    if (path === '/bootstrap') {
      const known = visitors.get(auth);
      if (known) current = known;
      else newVisitor();
      return json({
        context: { visible: true, initials: 'CF', avatar_url: null },
        widget: { reply: { label: 'soon' }, id: 'w', name: 'Support', settings: {}, online: true, team: [] },
        visitor: visitorBody(),
        realtime: { enabled: options.realtime ?? false },
        limits: { max_file_bytes: 10485760, max_text_length: 4000 },
        conversations: conversations.map(summary),
        request_form: options.requestForm
          ? {
              uuid: 'form-1',
              name: 'Before we start',
              description: '',
              fields: [
                { key: 'topic', source: 'conversation', type: 'select', label: 'Topic', help: '', required: true, options: [{ value: 'billing', label: 'Billing' }, { value: 'bug', label: 'Bug' }], placeholder: '', condition: null },
                { key: 'order', source: 'conversation', type: 'text', label: 'Order no', help: '', required: true, options: [], placeholder: '', condition: { field: 'topic', operator: 'equals', value: 'billing' } },
              ],
            }
          : null,
      });
    }
    if (!auth) return json({}, 401, 'UNAUTHENTICATED');
    const known = visitors.get(auth);
    if (!known) return json({}, 401, 'WIDGET_VISITOR_TOKEN_INVALID');
    current = known;
    if (path === '/identify') {
      if (!body.user_hash || !body.user_hash.startsWith('hash:')) return json({}, 403, 'WIDGET_IDENTITY_INVALID');
      current.identified = body;
      return json(visitorBody());
    }
    if (path === '/conversations' && init.method === 'GET') return json({ items: conversations.map(summary) });
    if (path === '/conversations' && init.method === 'POST') {
      const c = createConversation();
      const m = addMessage(c, 'in', body.text ?? '', { client_id: body.client_id, attachments: body.file ? [{ uuid: id('a'), filename: (body.file as { name: string }).name, content_type: 'image/png', size_bytes: 1, url: '/x' }] : [] });
      return json({ conversation_uuid: c.uuid, message: m, created: true });
    }
    if (path === '/help/search') return json({ available: true, help_center_url: 'https://help.example.test', items: [{ title: `About ${params.q}`, excerpt: '…', url: 'https://help.example.test/a' }] });
    if (path === '/realtime-token') return json({ ws_url: 'wss://rt.test', connection_token: 'c', subscription_token: 's', channel: 'widget:v', expires_at: '2030-01-01T00:00:00Z' });
    if (path === '/attributes') return json({ applied: Object.keys(body.attributes), ignored: [], unknown: [], pending: false });
    if (path === '/profile') {
      current.identified = { ...(current.identified ?? {}), ...body };
      return json(visitorBody());
    }
    const m = /^\/conversations\/([^/]+)(?:\/(messages|typing|read|rating))?$/.exec(path ?? '');
    const c = m ? conversations.find((x) => x.uuid === m[1]) : undefined;
    if (!m || !c) return json({}, 404, 'NOT_FOUND');
    if (m[2] === 'messages' && init.method === 'GET') {
      const limit = 50;
      let items = c.messages;
      if (params.after) items = items.slice(items.findIndex((x) => x.uuid === params.after) + 1);
      if (params.before) items = items.slice(0, items.findIndex((x) => x.uuid === params.before));
      const hasMore = items.length > limit;
      if (hasMore) items = items.slice(items.length - limit);
      return json({ conversation: summary(c), items, has_more: hasMore });
    }
    if (m[2] === 'messages') {
      const existing = c.messages.find((x) => x.client_id === body.client_id);
      const msg = existing ?? addMessage(c, 'in', body.text ?? '', { client_id: body.client_id, attachments: body.file ? [{ uuid: id('a'), filename: (body.file as { name: string }).name, content_type: 'image/png', size_bytes: 1, url: '/x' }] : [] });
      return json({ conversation_uuid: c.uuid, message: msg, created: false });
    }
    if (m[2] === 'typing') return json({ typing: body.typing });
    if (m[2] === 'read') {
      const n = c.messages.filter((x) => x.direction === 'out' && !x.read_at).length;
      for (const x of c.messages) if (x.direction === 'out') x.read_at = now();
      c.unread_count = 0;
      return json({ updated: n });
    }
    if (m[2] === 'rating') {
      c.rating = body.score;
      c.can_rate = false;
      return json({ score: body.score, comment: body.comment, created_at: now(), existing: false });
    }
    return json({}, 404, 'NOT_FOUND');
  };

  return {
    fetch,
    calls,
    /** An agent reply (what realtime would announce with message.created). */
    reply: (conversation: string, text: string) => addMessage(conversations.find((c) => c.uuid === conversation)!, 'out', text),
    resolve: (conversation: string) => {
      const c = conversations.find((x) => x.uuid === conversation)!;
      c.open = false;
      c.status = 'resolved';
      c.can_rate = true;
    },
    seed: (count: number) => {
      const c = createConversation();
      for (let i = 1; i <= count; i++) addMessage(c, i % 2 ? 'in' : 'out', `m${i}`);
      return c.uuid;
    },
    conversations,
    get token() {
      return current.token;
    },
  };
}
