import { useState, useEffect } from 'react';
let current: string | null = null;
const listeners = new Set<(u: string | null) => void>();
export function setURL(url: string | null) {
  current = url;
  for (const l of listeners) l(url);
}
export function useURL() {
  const [url, set] = useState(current);
  useEffect(() => {
    listeners.add(set);
    return () => {
      listeners.delete(set);
    };
  }, []);
  return url;
}
export function createURL(path: string, options: { scheme?: string } = {}) {
  return `${options.scheme ?? 'myapp'}://${path}`;
}
