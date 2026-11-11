import { ClickFixProvider, type ClickFixProviderProps } from '@getclickfix/react-native';
import { useMemo } from 'react';
import { appPackageName, isExpoGo } from './app.js';
import { secureStoreStorage, type SecureStoreStorageOptions } from './storage.js';

export interface ClickFixExpoProviderProps extends Omit<ClickFixProviderProps, 'packageName' | 'storage'> {
  /**
   * Package name registered with the app key; default: `ios.bundleIdentifier`
   * / `android.package` from app.json. Set it explicitly in Expo Go, whose
   * own bundle id is not yours (register that name with a development key).
   */
  packageName?: string;
  /** Token storage; default expo-secure-store. */
  storage?: ClickFixProviderProps['storage'];
  secureStore?: SecureStoreStorageOptions;
}

/**
 * One-line setup: `<ClickFixExpoProvider appKey widgetId baseUrl getUserHash>`.
 * Secure token storage, the app's package name and realtime are wired in.
 */
export function ClickFixExpoProvider(props: ClickFixExpoProviderProps) {
  const { packageName, storage, secureStore, ...rest } = props;
  const store = useMemo(() => storage ?? secureStoreStorage(secureStore), [storage, secureStore]);
  const name = packageName ?? appPackageName();
  if (!name) throw new Error(isExpoGo() ? 'ClickFixExpoProvider: pass packageName in Expo Go (register it with a development app key)' : 'ClickFixExpoProvider: app.json has no ios.bundleIdentifier / android.package; pass packageName');
  return <ClickFixProvider {...rest} packageName={name} storage={store} />;
}
