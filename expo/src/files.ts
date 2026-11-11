// Attachments via expo-file-system (SDK 54+ `File` API): any `file://` or
// content URI (image picker, document picker, camera) becomes the
// `{ uri, name, type }` descriptor the core sends as multipart.
import { File } from 'expo-file-system';
import type { NativeFile } from '@getclickfix/react-native';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  pdf: 'application/pdf',
  txt: 'text/plain',
  csv: 'text/csv',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  zip: 'application/zip',
};

/** MIME type by file extension; `application/octet-stream` when unknown. */
export function mimeTypeFor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return MIME[ext] ?? 'application/octet-stream';
}

export interface AttachmentOptions {
  /** File name shown to the agent; default: the file's own name. */
  name?: string;
  /** MIME type; default: the file's type, else guessed from the name. */
  type?: string;
  /** Reject files above this size in bytes (e.g. `bootstrap.limits.max_file_bytes`). */
  maxBytes?: number;
}

/**
 * A file descriptor for `send(text, file)` / `create(text, file)` from a
 * local URI. Throws when the file does not exist or exceeds `maxBytes`.
 */
export function fileAttachment(uri: string, options: AttachmentOptions = {}): NativeFile {
  const file = new File(uri);
  if (!file.exists) throw new Error(`file not found: ${uri}`);
  const name = options.name ?? file.name;
  if (options.maxBytes !== undefined && file.size !== null && file.size > options.maxBytes) throw new Error(`file exceeds ${options.maxBytes} bytes`);
  return { uri: file.uri, name, type: options.type ?? (file.type || mimeTypeFor(name)) };
}

/**
 * Opens the system file picker (expo-file-system) and returns the chosen
 * file as an attachment, or null when the visitor cancelled. Fits
 * `ChatScreen`'s `pickFile` prop directly.
 */
export async function pickAttachment(options: AttachmentOptions & { mimeTypes?: string | string[] } = {}): Promise<NativeFile | null> {
  const picked = await File.pickFileAsync({ mimeTypes: options.mimeTypes });
  if (picked.canceled || !picked.result) return null;
  return fileAttachment(picked.result.uri, options);
}
