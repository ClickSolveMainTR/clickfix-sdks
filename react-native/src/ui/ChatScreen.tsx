// One conversation (CF-202): message list (oldest at the bottom, like the
// web widget), composer with optional attachment, typing indicator, read
// receipts on focus, the start form for a new conversation and the rating
// row when the conversation can be rated.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { FileInput, SendInput } from '@getclickfix/visitor-core';
import { useClickFix, useConversation, useRating, type Message } from '../hooks.js';
import { PreChatForm, type FormValues } from './PreChatForm.js';
import { useClickFixUI, type ClickFixTheme, type ThemeProps } from './theme.js';

export interface ChatScreenProps extends ThemeProps {
  /** Existing conversation, or null to start a new one with the first message. */
  conversation: string | null;
  /** The first message created a conversation (navigate/replace with its id). */
  onCreated?: (uuid: string) => void;
  /** Lets the visitor pick a file; resolve null when cancelled. Hidden when omitted. */
  pickFile?: () => Promise<FileInput | null>;
  /** Show the widget's start form before the first message (default true when the widget has one). */
  startForm?: boolean;
  /** Ask for the consent checkbox on the start form. */
  requireConsent?: boolean;
  /** Show the rating row when the conversation can be rated (default true). */
  rating?: boolean;
  /** Poll interval while the realtime socket is down (ms). */
  pollMs?: number;
  renderMessage?: (message: Message, mine: boolean) => ReactElement | null;
  testID?: string;
}

export function ChatScreen(props: ChatScreenProps) {
  const { theme, labels } = useClickFixUI(props);
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { session } = useClickFix();
  const chat = useConversation(props.conversation, { pollMs: props.pollMs });
  const rating = useRating(chat.uuid);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<unknown>(null);
  const [pending, setPending] = useState<{ form: SendInput['form']; consent?: boolean } | null>(null);
  const list = useRef<FlatList<Message>>(null);
  const created = useRef(props.conversation);

  useEffect(() => {
    if (chat.uuid && chat.uuid !== created.current) {
      created.current = chat.uuid;
      props.onCreated?.(chat.uuid);
    }
  }, [chat.uuid, props]);

  // Read receipts: the visitor sees the agent's replies while this screen is open.
  useEffect(() => {
    if (chat.unread > 0) void chat.markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.unread, chat.uuid]);

  const send = useCallback(
    async (file?: FileInput) => {
      const body = text.trim();
      if ((!body && !file) || sending) return;
      setSending(true);
      setSendError(null);
      try {
        const input: SendInput = { text: body };
        if (pending?.form) input.form = pending.form;
        if (pending?.consent !== undefined) input.consent = pending.consent;
        await chat.send(input, file);
        setPending(null);
        setText('');
        void chat.setTyping(false);
      } catch (err) {
        setSendError(err);
      } finally {
        setSending(false);
      }
    },
    [text, sending, pending, chat],
  );

  const attach = useCallback(async () => {
    if (!props.pickFile) return;
    const file = await props.pickFile();
    if (file) await send(file);
  }, [props.pickFile, send]);

  const data = useMemo(() => [...chat.messages].reverse(), [chat.messages]);
  const canRate = props.rating !== false && chat.conversation?.can_rate && !rating.rating && chat.conversation.rating === null;

  const form = session.bootstrap?.request_form ?? null;
  if (!chat.uuid && form && props.startForm !== false && !pending) {
    return (
      <PreChatForm
        form={form}
        requireConsent={props.requireConsent}
        theme={props.theme}
        labels={props.labels}
        onSubmit={(values: FormValues, consent) => setPending({ form: { form_uuid: form.uuid, values }, consent: props.requireConsent ? consent : undefined })}
        testID="clickfix-start-form"
      />
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} testID={props.testID}>
      <FlatList
        ref={list}
        inverted
        data={data}
        keyExtractor={(m) => m.uuid}
        contentContainerStyle={styles.list}
        onEndReached={() => void chat.loadMore()}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          chat.agentTyping ? (
            <Text style={styles.typing} testID="clickfix-agent-typing">
              {labels.agentTyping}
            </Text>
          ) : undefined
        }
        ListFooterComponent={
          chat.loading ? (
            <ActivityIndicator color={theme.colors.primary} style={styles.spinner} />
          ) : chat.hasMore ? (
            <Pressable onPress={() => void chat.loadMore()} accessibilityRole="button">
              <Text style={styles.link}>{labels.loadOlder}</Text>
            </Pressable>
          ) : undefined
        }
        renderItem={({ item }) => {
          const mine = item.direction === 'in';
          if (props.renderMessage) return props.renderMessage(item, mine);
          return (
            <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]} testID={`clickfix-message-${item.uuid}`}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                {!mine && item.sender_name ? <Text style={styles.sender}>{item.sender_name}</Text> : null}
                {item.content ? <Text style={[styles.bubbleText, mine ? styles.textMine : styles.textTheirs]}>{item.content}</Text> : null}
                {item.attachments.map((a) => (
                  <Text key={a.uuid} style={[styles.attachment, mine ? styles.textMine : styles.textTheirs]} numberOfLines={1}>
                    📎 {a.filename}
                  </Text>
                ))}
              </View>
            </View>
          );
        }}
      />
      {chat.error || sendError ? <Text style={styles.errorText}>{labels.error}</Text> : null}
      {canRate ? (
        <View style={styles.ratingRow} testID="clickfix-rating">
          <Text style={styles.label}>{labels.rateTitle}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((score) => (
              <Pressable key={score} onPress={() => void rating.submit(score).catch(() => undefined)} accessibilityRole="button" accessibilityLabel={`${score}`} style={styles.star} testID={`clickfix-rate-${score}`}>
                <Text style={styles.starText}>★</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : rating.rating ? (
        <Text style={styles.muted}>{labels.rateThanks}</Text>
      ) : null}
      {chat.conversation && !chat.conversation.open ? null : (
        <View style={styles.composer}>
          {props.pickFile ? (
            <Pressable onPress={() => void attach()} accessibilityRole="button" accessibilityLabel={labels.attach} style={styles.iconButton} testID="clickfix-attach">
              <Text style={styles.iconText}>+</Text>
            </Pressable>
          ) : null}
          <TextInput
            value={text}
            onChangeText={(t) => {
              setText(t);
              if (t) void chat.setTyping(true);
            }}
            onBlur={() => void chat.setTyping(false)}
            placeholder={labels.messagePlaceholder}
            placeholderTextColor={theme.colors.muted}
            multiline
            style={styles.input}
            editable={!sending}
            testID="clickfix-composer"
          />
          <Pressable
            onPress={() => void send()}
            disabled={sending || !text.trim()}
            accessibilityRole="button"
            accessibilityLabel={labels.send}
            style={[styles.sendButton, (sending || !text.trim()) && styles.disabled]}
            testID="clickfix-send"
          >
            <Text style={styles.sendText}>{labels.send}</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const makeStyles = (t: ClickFixTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    list: { padding: t.spacing, gap: 6 },
    bubbleRow: { flexDirection: 'row' },
    rowMine: { justifyContent: 'flex-end' },
    rowTheirs: { justifyContent: 'flex-start' },
    bubble: { maxWidth: '82%', borderRadius: t.radius, paddingVertical: 8, paddingHorizontal: 12 },
    bubbleMine: { backgroundColor: t.colors.bubbleOut, borderBottomRightRadius: 4 },
    bubbleTheirs: { backgroundColor: t.colors.bubbleIn, borderBottomLeftRadius: 4 },
    bubbleText: { fontSize: t.fontSize, fontFamily: t.fontFamily },
    textMine: { color: t.colors.onBubbleOut },
    textTheirs: { color: t.colors.onBubbleIn },
    sender: { color: t.colors.muted, fontSize: t.fontSize - 4, marginBottom: 2, fontFamily: t.fontFamily },
    attachment: { fontSize: t.fontSize - 2, marginTop: 4, textDecorationLine: 'underline', fontFamily: t.fontFamily },
    typing: { color: t.colors.muted, fontSize: t.fontSize - 3, marginBottom: 6, fontFamily: t.fontFamily },
    spinner: { marginVertical: t.spacing },
    link: { color: t.colors.primary, fontSize: t.fontSize - 2, textAlign: 'center', marginVertical: t.spacing / 2, fontFamily: t.fontFamily },
    errorText: { color: t.colors.danger, fontSize: t.fontSize - 3, paddingHorizontal: t.spacing, fontFamily: t.fontFamily },
    muted: { color: t.colors.muted, fontSize: t.fontSize - 2, padding: t.spacing, textAlign: 'center', fontFamily: t.fontFamily },
    label: { color: t.colors.text, fontSize: t.fontSize - 1, fontWeight: '600', fontFamily: t.fontFamily },
    ratingRow: { padding: t.spacing, borderTopWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, backgroundColor: t.colors.surface, alignItems: 'center' },
    stars: { flexDirection: 'row', marginTop: 6 },
    star: { padding: 6 },
    starText: { color: t.colors.primary, fontSize: 26 },
    composer: { flexDirection: 'row', alignItems: 'flex-end', padding: t.spacing / 2, borderTopWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, backgroundColor: t.colors.surface },
    iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    iconText: { color: t.colors.primary, fontSize: 26, lineHeight: 30 },
    input: { flex: 1, maxHeight: 120, minHeight: 40, paddingHorizontal: t.spacing, paddingVertical: 8, borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radius, color: t.colors.text, backgroundColor: t.colors.background, fontSize: t.fontSize, fontFamily: t.fontFamily },
    sendButton: { marginLeft: t.spacing / 2, paddingHorizontal: t.spacing, height: 40, justifyContent: 'center', borderRadius: t.radius, backgroundColor: t.colors.primary },
    sendText: { color: t.colors.onPrimary, fontWeight: '600', fontSize: t.fontSize - 1, fontFamily: t.fontFamily },
    disabled: { opacity: 0.5 },
  });
