export { ClickFixProvider } from './provider.js';
export type { ClickFixProviderProps } from './provider.js';
export { ClickFixContext } from './context.js';
export type { ClickFixContextValue, ClickFixStatus, GetUserHash, RealtimeEvent } from './context.js';
export { useClickFix, useVisitor, useConversations, useConversation, useHelpSearch, useRating } from './hooks.js';
export type { IdentifyOptions, ConversationOptions, Message } from './hooks.js';
export { memoryStorage, keychainStorage, tokenStorageKey } from './storage.js';
export type { SecureStorage, KeychainLike } from './storage.js';
export { parseConversationLink, useDeepLinkConversation } from './deeplink.js';
export type { LinkingLike } from './deeplink.js';
export { VisitorError, isNetworkError, createVisitorClient, createRealtime } from '@getclickfix/visitor-core';
export type {
  VisitorClient,
  Session,
  Bootstrap,
  Visitor,
  Conversation,
  MessagePage,
  SendInput,
  Sent,
  IdentifyInput,
  ProfileInput,
  AttributesInput,
  AttributesResult,
  HelpResult,
  Rating,
  FileInput,
  NativeFile,
  TrackedEvent,
  components,
} from '@getclickfix/visitor-core';
