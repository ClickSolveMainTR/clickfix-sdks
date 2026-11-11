// Hooks and screens run under the React Native Jest preset (no DOM, RN's
// own mocks for native modules), against the TypeScript sources and the
// workspace core's sources, with a fake `fetch` (tests/stub.ts).
module.exports = {
  preset: '@react-native/jest-preset',
  // The first render of a suite pays the cold Babel transform of react-native
  // (several seconds on a shared runner); 5 s would fail it before any assertion.
  testTimeout: 30000,
  testMatch: ['<rootDir>/tests/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@getclickfix/visitor-core$': '<rootDir>/../visitor-core/src/index.ts',
  },
  // pnpm keeps packages under node_modules/.pnpm/<name>@<version>/node_modules/<name>:
  // transform React Native and its scoped packages at both depths.
  transformIgnorePatterns: ['node_modules/(?!\\.pnpm/)(?!((jest-)?react-native|@react-native(-community)?)/)', 'node_modules/\\.pnpm/(?!((jest-)?react-native|@react-native(-community)?)[@+])'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  fakeTimers: { enableGlobally: false },
};
