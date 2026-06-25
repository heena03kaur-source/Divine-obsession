export function getApiUrl(path: string): string {
  const metaEnv = (import.meta as any).env || {};
  if (metaEnv.VITE_API_URL) {
    const base = metaEnv.VITE_API_URL.endsWith("/")
      ? metaEnv.VITE_API_URL.slice(0, -1)
      : metaEnv.VITE_API_URL;
    return `${base}${path}`;
  }
  
  return path;
}
