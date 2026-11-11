export const store = new Map<string, string>();
export const calls: unknown[][] = [];
export type SecureStoreOptions = { keychainService?: string };
export async function getItemAsync(key: string, options?: SecureStoreOptions) {
  calls.push(['get', key, options]);
  return store.get(key) ?? null;
}
export async function setItemAsync(key: string, value: string, options?: SecureStoreOptions) {
  calls.push(['set', key, options]);
  if (!/^[A-Za-z0-9._-]+$/.test(key)) throw new Error(`invalid SecureStore key: ${key}`);
  store.set(key, value);
}
export async function deleteItemAsync(key: string, options?: SecureStoreOptions) {
  calls.push(['delete', key, options]);
  store.delete(key);
}
