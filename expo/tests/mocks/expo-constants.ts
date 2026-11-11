export const config = {
  expoConfig: { version: '1.2.3', ios: { bundleIdentifier: 'com.example.app' }, android: { package: 'com.example.app' } } as { version?: string; ios?: { bundleIdentifier?: string }; android?: { package?: string } } | null,
  executionEnvironment: 'standalone',
};
export default config;
