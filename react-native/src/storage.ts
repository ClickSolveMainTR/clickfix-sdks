// Where the visitor token lives between launches (CF-202). The token is a
// bearer credential for the visitor's conversations, so it belongs in the
// platform keystore: `react-native-keychain` on bare React Native (adapter
// below), `expo-secure-store` on Expo (`@getclickfix/expo`). The default is
// process memory: the session is renewed on every cold start, nothing is
// written to disk.

export interface SecureStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/** Storage key of a widget's visitor token (letters, digits, `.`, `-`, `_` only: every keystore accepts it). */
export function tokenStorageKey(widgetId: string): string {
  return `clickfix.visitor-token.${widgetId.replace(/[^A-Za-z0-9._-]/g, '_')}`;
}

/** Default: the token lives as long as the JavaScript runtime. */
export function memoryStorage(): SecureStorage {
  const map = new Map<string, string>();
  return {
    async get(key) {
      return map.get(key) ?? null;
    },
    async set(key, value) {
      map.set(key, value);
    },
    async remove(key) {
      map.delete(key);
    },
  };
}

/** The subset of `react-native-keychain` the adapter uses (pass the module itself). */
export interface KeychainLike {
  setGenericPassword(username: string, password: string, options?: { service?: string }): Promise<unknown>;
  getGenericPassword(options?: { service?: string }): Promise<false | { username: string; password: string }>;
  resetGenericPassword(options?: { service?: string }): Promise<boolean>;
}

/**
 * Keychain / Keystore storage for bare React Native:
 * `keychainStorage(require('react-native-keychain'))`. One keychain entry
 * per key (`service` = the key), so several widgets do not overwrite each other.
 */
export function keychainStorage(keychain: KeychainLike, options: { servicePrefix?: string } = {}): SecureStorage {
  const service = (key: string) => `${options.servicePrefix ?? ''}${key}`;
  return {
    async get(key) {
      const entry = await keychain.getGenericPassword({ service: service(key) });
      return entry ? entry.password : null;
    },
    async set(key, value) {
      await keychain.setGenericPassword('clickfix', value, { service: service(key) });
    },
    async remove(key) {
      await keychain.resetGenericPassword({ service: service(key) });
    },
  };
}
