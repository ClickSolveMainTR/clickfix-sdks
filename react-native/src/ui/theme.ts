// Theme and labels of the optional screens (CF-202). Plain StyleSheet
// values so an app can match its own look: pass `theme`/`labels` to a
// screen or wrap the tree in <ClickFixThemeProvider>. Colors follow the web
// widget's defaults (panel accent #2563eb, light surfaces).
import { createContext, useContext } from 'react';

export interface ClickFixTheme {
  colors: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
    primary: string;
    onPrimary: string;
    /** Visitor bubbles. */
    bubbleOut: string;
    onBubbleOut: string;
    /** Agent bubbles. */
    bubbleIn: string;
    onBubbleIn: string;
    danger: string;
    badge: string;
    onBadge: string;
  };
  radius: number;
  spacing: number;
  fontSize: number;
  /** Font family; undefined = platform default. */
  fontFamily?: string;
}

export const lightTheme: ClickFixTheme = {
  colors: {
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    muted: '#64748b',
    border: '#e2e8f0',
    primary: '#2563eb',
    onPrimary: '#ffffff',
    bubbleOut: '#2563eb',
    onBubbleOut: '#ffffff',
    bubbleIn: '#f1f5f9',
    onBubbleIn: '#0f172a',
    danger: '#dc2626',
    badge: '#2563eb',
    onBadge: '#ffffff',
  },
  radius: 12,
  spacing: 12,
  fontSize: 15,
};

export const darkTheme: ClickFixTheme = {
  ...lightTheme,
  colors: {
    background: '#0b1220',
    surface: '#111a2e',
    text: '#e5e7eb',
    muted: '#94a3b8',
    border: '#1f2a44',
    primary: '#3b82f6',
    onPrimary: '#ffffff',
    bubbleOut: '#3b82f6',
    onBubbleOut: '#ffffff',
    bubbleIn: '#1f2a44',
    onBubbleIn: '#e5e7eb',
    danger: '#f87171',
    badge: '#3b82f6',
    onBadge: '#ffffff',
  },
};

export interface ClickFixLabels {
  conversations: string;
  newConversation: string;
  noConversations: string;
  loading: string;
  error: string;
  retry: string;
  messagePlaceholder: string;
  send: string;
  attach: string;
  agentTyping: string;
  loadOlder: string;
  resolved: string;
  rateTitle: string;
  rateComment: string;
  rateSubmit: string;
  rateThanks: string;
  formTitle: string;
  formStart: string;
  formRequired: string;
  consent: string;
  yes: string;
  no: string;
  you: string;
}

export const labelsEn: ClickFixLabels = {
  conversations: 'Conversations',
  newConversation: 'New conversation',
  noConversations: 'No conversations yet. Start one and we will reply here.',
  loading: 'Loading…',
  error: 'Something went wrong.',
  retry: 'Retry',
  messagePlaceholder: 'Write a message…',
  send: 'Send',
  attach: 'Attach',
  agentTyping: 'is typing…',
  loadOlder: 'Load older messages',
  resolved: 'Resolved',
  rateTitle: 'How was our help?',
  rateComment: 'Add a comment (optional)',
  rateSubmit: 'Send rating',
  rateThanks: 'Thank you for your feedback.',
  formTitle: 'Before we start',
  formStart: 'Start conversation',
  formRequired: 'This field is required.',
  consent: 'I agree to the processing of my data.',
  yes: 'Yes',
  no: 'No',
  you: 'You',
};

export const labelsTr: ClickFixLabels = {
  conversations: 'Konuşmalar',
  newConversation: 'Yeni konuşma',
  noConversations: 'Henüz konuşma yok. Bir konuşma başlatın, burada yanıtlayalım.',
  loading: 'Yükleniyor…',
  error: 'Bir sorun oluştu.',
  retry: 'Tekrar dene',
  messagePlaceholder: 'Mesaj yazın…',
  send: 'Gönder',
  attach: 'Dosya ekle',
  agentTyping: 'yazıyor…',
  loadOlder: 'Önceki mesajları yükle',
  resolved: 'Çözüldü',
  rateTitle: 'Yardımımızı nasıl buldunuz?',
  rateComment: 'Yorum ekleyin (isteğe bağlı)',
  rateSubmit: 'Puanı gönder',
  rateThanks: 'Geri bildiriminiz için teşekkürler.',
  formTitle: 'Başlamadan önce',
  formStart: 'Konuşmayı başlat',
  formRequired: 'Bu alan zorunludur.',
  consent: 'Verilerimin işlenmesini kabul ediyorum.',
  yes: 'Evet',
  no: 'Hayır',
  you: 'Siz',
};

export interface ClickFixUIContextValue {
  theme: ClickFixTheme;
  labels: ClickFixLabels;
}

export const ClickFixUIContext = createContext<ClickFixUIContextValue>({ theme: lightTheme, labels: labelsEn });

export interface ThemeProps {
  /** Overrides (deep-merged into the context theme). */
  theme?: Partial<ClickFixTheme> & { colors?: Partial<ClickFixTheme['colors']> };
  labels?: Partial<ClickFixLabels>;
}

/** Theme and labels of every screen below; nest to override per screen. */
export function useClickFixUI(props: ThemeProps = {}): ClickFixUIContextValue {
  const base = useContext(ClickFixUIContext);
  if (!props.theme && !props.labels) return base;
  return {
    theme: { ...base.theme, ...props.theme, colors: { ...base.theme.colors, ...props.theme?.colors } },
    labels: { ...base.labels, ...props.labels },
  };
}
