// Deep links (CF-202): open the app on one conversation. Accepted shapes,
// with any scheme or host:
//   https://app.example.com/support?conversation=<uuid>
//   myapp://support/conversation/<uuid>      myapp://conversations/<uuid>
//   exp://192.168.1.2:8081/--/conversation/<uuid>   (Expo Go)
import { useEffect, useState } from 'react';
import { Linking } from 'react-native';

const ID = /^[A-Za-z0-9-]{8,64}$/;

/** The conversation id a URL points at, or null. */
export function parseConversationLink(url: string | null | undefined): string | null {
  if (!url) return null;
  const rest = url.replace(/^[A-Za-z][A-Za-z0-9+.-]*:(\/\/)?/, '').split('#')[0] ?? '';
  const [path = '', query = ''] = rest.split('?');
  for (const pair of query.split('&')) {
    const [k, v = ''] = pair.split('=');
    if (k === 'conversation') {
      const id = safeDecode(v);
      return ID.test(id) ? id : null;
    }
  }
  const segments = path.split('/').filter(Boolean);
  for (let i = 0; i + 1 < segments.length; i++) {
    const s = segments[i]!.toLowerCase();
    if (s === 'conversation' || s === 'conversations' || s === 'chat') {
      const id = safeDecode(segments[i + 1]!);
      return ID.test(id) ? id : null;
    }
  }
  return null;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export interface LinkingLike {
  getInitialURL(): Promise<string | null | undefined>;
  addEventListener(type: 'url', handler: (event: { url: string }) => void): { remove(): void };
}

/**
 * The conversation the app was opened with (initial URL) or receives while
 * running; `clear()` after navigating so a re-render does not open it twice.
 */
export function useDeepLinkConversation(linking: LinkingLike = Linking) {
  const [conversation, setConversation] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    linking
      .getInitialURL()
      .then((url) => {
        if (live) setConversation((c) => c ?? parseConversationLink(url));
      })
      .catch(() => undefined);
    const sub = linking.addEventListener('url', ({ url }) => {
      const id = parseConversationLink(url);
      if (id) setConversation(id);
    });
    return () => {
      live = false;
      sub.remove();
    };
  }, [linking]);
  return { conversation, clear: () => setConversation(null) };
}
