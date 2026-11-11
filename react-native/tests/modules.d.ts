// React Native ships this file without types; the test setup installs it as the global FormData.
declare module 'react-native/Libraries/Network/FormData' {
  const FormData: new () => { append(name: string, value: unknown): void; getParts(): unknown[] };
  export default FormData;
}
