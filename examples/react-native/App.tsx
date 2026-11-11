// ClickFix in an Expo app (CF-202): sign in (simulated), identify the
// visitor with a server-signed user_hash, list conversations, chat, and
// open one conversation from a deep link
// (clickfixexample://conversation/<uuid>; in Expo Go
// exp://<host>/--/conversation/<uuid>). Screens come from
// @getclickfix/react-native/ui; everything else is the hooks.
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  ClickFixExpoProvider,
  pickAttachment,
  useClickFix,
  useExpoDeepLinkConversation,
  useVisitor,
  VisitorError,
} from '@getclickfix/expo';
import { ChatScreen, ClickFixThemeProvider, ConversationListScreen, labelsTr } from '@getclickfix/react-native/ui';
import { config } from './config';

type Screen = { name: 'home' } | { name: 'list' } | { name: 'chat'; conversation: string | null };

interface SupportSession {
  user_id: string;
  user_hash: string;
  name: string;
  email: string;
  company?: { id: string; name: string };
}

/** Your backend signs user_hash with the widget's identity secret (server.mjs). */
async function fetchSupportSession(userId: string): Promise<SupportSession> {
  const res = await fetch(`${config.serverUrl}/support-session?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`support-session ${res.status}`);
  return (await res.json()) as SupportSession;
}

export default function App() {
  return (
    <ClickFixExpoProvider
      appKey={config.appKey}
      widgetId={config.widgetId}
      baseUrl={config.baseUrl}
      packageName={config.packageName}
      language="tr"
      screen="home"
      // Lets identify({ userId }) omit userHash: the provider asks your server.
      getUserHash={async (userId) => (await fetchSupportSession(userId)).user_hash}
      onError={(err) => console.warn('ClickFix', err instanceof VisitorError ? `${err.status} ${err.code}` : err)}
    >
      <ClickFixThemeProvider labels={labelsTr}>
        <Main />
      </ClickFixThemeProvider>
    </ClickFixExpoProvider>
  );
}

function Main() {
  const { status, error, connected } = useClickFix();
  const visitor = useVisitor();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [user, setUser] = useState<SupportSession | null>(null);
  const [busy, setBusy] = useState(false);
  const link = useExpoDeepLinkConversation();

  // A deep link opens its conversation (the token in SecureStore makes it the same visitor).
  useEffect(() => {
    if (link.conversation && status === 'ready') {
      setScreen({ name: 'chat', conversation: link.conversation });
      link.clear();
    }
  }, [link, status]);

  useEffect(() => {
    visitor.setScreen(screen.name === 'chat' ? `chat/${screen.conversation ?? 'new'}` : screen.name);
  }, [screen, visitor]);

  // Simulated sign-in: the server returns the signed session; identify sends it with the external ids.
  const signIn = async (userId: string) => {
    setBusy(true);
    try {
      const session = await fetchSupportSession(userId);
      await visitor.identify({
        userId: session.user_id,
        userHash: session.user_hash,
        name: session.name,
        email: session.email,
        company: session.company, // company.id is signed into user_hash (CF-206)
      });
      await visitor.setAttributes({ plan: 'pro', app_version: '1.0.0' });
      visitor.track('signed_in', { user_id: session.user_id });
      setUser(session);
    } finally {
      setBusy(false);
    }
  };
  const signOut = async () => {
    await visitor.reset();
    setUser(null);
    setScreen({ name: 'home' });
  };

  if (status === 'loading' || status === 'idle') return <Centered text="Bağlanıyor…" />;
  if (status === 'error') return <Centered text={`Bağlanamadı: ${error instanceof VisitorError ? `${error.status} ${error.code}` : String(error)}`} />;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="auto" />
      <View style={styles.bar}>
        <Pressable onPress={() => setScreen(screen.name === 'chat' ? { name: 'list' } : { name: 'home' })} disabled={screen.name === 'home'}>
          <Text style={styles.link}>{screen.name === 'home' ? ' ' : '‹ Geri'}</Text>
        </Pressable>
        <Text style={styles.title}>{user ? user.name : 'Ziyaretçi'}</Text>
        <Text style={styles.dot}>{connected ? '● canlı' : '○ anket'}</Text>
      </View>
      {screen.name === 'home' ? (
        <View style={styles.home}>
          <Text style={styles.h1}>ClickFix örnek</Text>
          <Text style={styles.p}>
            {visitor.verified
              ? `Doğrulandı: ${visitor.visitor?.contact?.email ?? ''}${visitor.visitor?.company_verified ? ' (firma imzalı)' : ''}`
              : 'Anonim ziyaretçi. Giriş yapınca sunucu user_hash üretir ve identify ile gönderilir.'}
          </Text>
          {user ? (
            <Button title="Çıkış" onPress={() => void signOut()} />
          ) : (
            <>
              <Button title={busy ? '…' : 'Ayşe olarak giriş (firmalı)'} onPress={() => void signIn('1001')} disabled={busy} />
              <Button title={busy ? '…' : 'Mehmet olarak giriş'} onPress={() => void signIn('1002')} disabled={busy} />
            </>
          )}
          <Button title="Konuşmalar" onPress={() => setScreen({ name: 'list' })} />
          <Button title="Yeni konuşma" onPress={() => setScreen({ name: 'chat', conversation: null })} />
        </View>
      ) : screen.name === 'list' ? (
        <ConversationListScreen onOpen={(c) => setScreen({ name: 'chat', conversation: c.uuid })} onNew={() => setScreen({ name: 'chat', conversation: null })} />
      ) : (
        <ChatScreen
          conversation={screen.conversation}
          onCreated={(uuid) => setScreen({ name: 'chat', conversation: uuid })}
          pickFile={() => pickAttachment({ mimeTypes: ['image/*', 'application/pdf'], maxBytes: 10 * 1024 * 1024 })}
          requireConsent
        />
      )}
    </SafeAreaView>
  );
}

function Centered({ text }: { text: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.p}>{text}</Text>
    </View>
  );
}

function Button({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, (pressed || disabled) && styles.pressed]}>
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e2e8f0' },
  title: { fontWeight: '600', color: '#0f172a' },
  dot: { color: '#64748b', fontSize: 12 },
  link: { color: '#2563eb', fontSize: 16 },
  home: { padding: 24, gap: 12 },
  h1: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  p: { color: '#334155', fontSize: 15, lineHeight: 22 },
  button: { backgroundColor: '#2563eb', borderRadius: 12, padding: 14, alignItems: 'center' },
  pressed: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
