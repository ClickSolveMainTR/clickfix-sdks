declare module 'react-native/Libraries/Network/FormData' {
  const FormData: new () => { append(name: string, value: unknown): void; getParts(): unknown[] };
  export default FormData;
}
