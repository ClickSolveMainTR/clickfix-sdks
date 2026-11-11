// React Native's own FormData (what Hermes apps use: `{ uri, name, type }`
// descriptors become multipart parts) instead of Node's, which stringifies
// non-Blob values.
import FormData from 'react-native/Libraries/Network/FormData';

(globalThis as unknown as { FormData: unknown }).FormData = FormData;
