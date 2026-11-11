// Values of this example. Set them with EXPO_PUBLIC_* variables (.env in
// this directory or the shell) or edit here. The app key and widget id are
// public identifiers; the identity secret never leaves server.mjs.
export const config = {
  /** The ClickFix app, e.g. https://support.example.com */
  baseUrl: process.env.EXPO_PUBLIC_CLICKFIX_BASE_URL ?? 'http://localhost:8080',
  /** Public widget id (Web widget → Install). */
  widgetId: process.env.EXPO_PUBLIC_CLICKFIX_WIDGET_ID ?? 'WIDGET_ID',
  /** Mobile app key (Web widget → Advanced → Mobile apps), bound to com.example.clickfix. */
  appKey: process.env.EXPO_PUBLIC_CLICKFIX_APP_KEY ?? 'cf_app_...',
  /** Your backend that signs user_hash (server.mjs here; a phone needs your machine's LAN address). */
  serverUrl: process.env.EXPO_PUBLIC_SUPPORT_SERVER_URL ?? 'http://localhost:8787',
  /** Only in Expo Go: the package name registered with a development app key (Expo Go's own bundle id is not yours). */
  packageName: process.env.EXPO_PUBLIC_CLICKFIX_PACKAGE_NAME,
};
