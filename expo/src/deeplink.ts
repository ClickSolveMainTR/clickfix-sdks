// Deep links with expo-linking: the hook handles the initial URL and later
// URLs (including Expo Go's `exp://.../--/conversation/<id>`), and
// `conversationURL` builds a link in the app's own scheme for push
// payloads, e-mails and tests.
import { createURL, useURL } from 'expo-linking';
import { useEffect, useState } from 'react';
import { parseConversationLink } from '@getclickfix/react-native';

/** `myapp://conversation/<uuid>` (or the Expo Go/dev-client equivalent while developing). */
export function conversationURL(conversation: string, options: Parameters<typeof createURL>[1] = {}): string {
  return createURL(`conversation/${encodeURIComponent(conversation)}`, options);
}

/** The conversation the app was opened with or received while running; `clear()` after navigating. */
export function useExpoDeepLinkConversation() {
  const url = useURL();
  const [conversation, setConversation] = useState<string | null>(null);
  useEffect(() => {
    const id = parseConversationLink(url);
    if (id) setConversation(id);
  }, [url]);
  return { conversation, clear: () => setConversation(null) };
}
