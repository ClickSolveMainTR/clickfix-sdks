// App identity from expo-constants: the package name the mobile app key is
// bound to (`ios.bundleIdentifier` / `android.package` of app.json) and the
// version, so `ClickFixExpoProvider` needs no copy of them.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** The bundle id (iOS) or application id (Android) of the running app, or null when app.json has none. */
export function appPackageName(): string | null {
  const config = Constants.expoConfig;
  if (!config) return null;
  if (Platform.OS === 'ios') return config.ios?.bundleIdentifier ?? null;
  if (Platform.OS === 'android') return config.android?.package ?? null;
  return null;
}

/** `version` of app.json (null outside an Expo build). */
export function appVersion(): string | null {
  return Constants.expoConfig?.version ?? null;
}

/** True in Expo Go (where the package name is Expo Go's own, not yours). */
export function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}
