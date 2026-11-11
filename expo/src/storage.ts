// Visitor token in the device keystore via expo-secure-store (Keychain on
// iOS, EncryptedSharedPreferences/Keystore on Android). Works in Expo Go.
import * as SecureStore from 'expo-secure-store';
import type { SecureStorage } from '@getclickfix/react-native';

export interface SecureStoreStorageOptions {
  /** Passed to every SecureStore call (`keychainAccessible`, `keychainService`, ...). */
  options?: SecureStore.SecureStoreOptions;
}

/** `SecureStorage` over expo-secure-store; the default of `ClickFixExpoProvider`. */
export function secureStoreStorage(opts: SecureStoreStorageOptions = {}): SecureStorage {
  return {
    get: (key) => SecureStore.getItemAsync(key, opts.options),
    set: (key, value) => SecureStore.setItemAsync(key, value, opts.options),
    remove: (key) => SecureStore.deleteItemAsync(key, opts.options),
  };
}
