import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { Conversation } from '@getclickfix/visitor-core';
import { useConversations } from '../hooks.js';
import { useClickFixUI, type ClickFixTheme, type ThemeProps } from './theme.js';

export interface ConversationListScreenProps extends ThemeProps {
  /** A conversation was tapped. */
  onOpen: (conversation: Conversation) => void;
  /** The "new conversation" button was tapped (hidden when omitted). */
  onNew?: () => void;
  /** Formats `last_message_at`; default: locale time or date. */
  formatTime?: (iso: string) => string;
  testID?: string;
}

export function ConversationListScreen(props: ConversationListScreenProps) {
  const { theme, labels } = useClickFixUI(props);
  const { items, loading, error, reload } = useConversations();
  const styles = makeStyles(theme);
  const time = props.formatTime ?? defaultTime;
  return (
    <View style={styles.root} testID={props.testID}>
      <FlatList
        data={items}
        keyExtractor={(c) => c.uuid}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void reload()} tintColor={theme.colors.primary} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? undefined : (
            <View style={styles.empty}>
              <Text style={styles.muted}>{error ? labels.error : labels.noConversations}</Text>
              {error ? (
                <Pressable onPress={() => void reload()} accessibilityRole="button">
                  <Text style={styles.link}>{labels.retry}</Text>
                </Pressable>
              ) : null}
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => props.onOpen(item)}
            accessibilityRole="button"
            accessibilityLabel={`#${item.number} ${item.last_message_preview}`}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            testID={`clickfix-conversation-${item.uuid}`}
          >
            <View style={styles.rowBody}>
              <View style={styles.rowHead}>
                <Text style={styles.title} numberOfLines={1}>{`#${item.number}${item.open ? '' : ` · ${labels.resolved}`}`}</Text>
                <Text style={styles.muted}>{time(item.last_message_at)}</Text>
              </View>
              <Text style={[styles.preview, item.unread_count > 0 && styles.previewUnread]} numberOfLines={2}>
                {`${item.last_message_direction === 'in' ? `${labels.you}: ` : ''}${item.last_message_preview}`}
              </Text>
            </View>
            {item.unread_count > 0 ? (
              <View style={styles.badge} accessibilityLabel={`${item.unread_count}`}>
                <Text style={styles.badgeText}>{item.unread_count}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
      />
      {props.onNew ? (
        <Pressable onPress={props.onNew} accessibilityRole="button" style={({ pressed }) => [styles.button, pressed && styles.pressed]} testID="clickfix-new-conversation">
          <Text style={styles.buttonText}>{labels.newConversation}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function defaultTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString();
}

const makeStyles = (t: ClickFixTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    row: { flexDirection: 'row', alignItems: 'center', padding: t.spacing, backgroundColor: t.colors.surface },
    rowBody: { flex: 1 },
    rowHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    pressed: { opacity: 0.7 },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: t.colors.border },
    title: { color: t.colors.text, fontSize: t.fontSize, fontWeight: '600', fontFamily: t.fontFamily, flexShrink: 1 },
    preview: { color: t.colors.muted, fontSize: t.fontSize - 1, fontFamily: t.fontFamily },
    previewUnread: { color: t.colors.text, fontWeight: '600' },
    muted: { color: t.colors.muted, fontSize: t.fontSize - 2, fontFamily: t.fontFamily },
    link: { color: t.colors.primary, fontSize: t.fontSize, marginTop: t.spacing / 2, fontFamily: t.fontFamily },
    badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: t.colors.badge, alignItems: 'center', justifyContent: 'center', marginLeft: t.spacing },
    badgeText: { color: t.colors.onBadge, fontSize: 12, fontWeight: '700' },
    empty: { padding: t.spacing * 2, alignItems: 'center' },
    button: { margin: t.spacing, padding: t.spacing, borderRadius: t.radius, backgroundColor: t.colors.primary, alignItems: 'center' },
    buttonText: { color: t.colors.onPrimary, fontSize: t.fontSize, fontWeight: '600', fontFamily: t.fontFamily },
  });
