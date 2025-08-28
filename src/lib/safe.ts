export function safeJson<T = unknown>(s: string | null | undefined, fb: T): T {
  if (!s) return fb;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fb;
  }
}
export const isServer = () => typeof window === "undefined";
export const isClient = () => !isServer();
