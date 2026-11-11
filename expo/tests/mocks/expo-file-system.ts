export const files = new Map<string, { size: number; type: string }>();
export let picked: { uri: string } | null = null;
export const setPicked = (p: { uri: string } | null) => (picked = p);
export class File {
  constructor(public uri: string) {}
  get exists() {
    return files.has(this.uri);
  }
  get name() {
    return this.uri.split('/').pop() ?? '';
  }
  get size() {
    return files.get(this.uri)?.size ?? null;
  }
  get type() {
    return files.get(this.uri)?.type ?? null;
  }
  static async pickFileAsync() {
    return picked ? { canceled: false as const, result: new File(picked.uri) } : { canceled: true as const, result: null };
  }
}
