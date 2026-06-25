export function getApiUrl(path: string): string {
  const metaEnv = (import.meta as any).env || {};
  if (metaEnv.VITE_API_URL) {
    const base = metaEnv.VITE_API_URL.endsWith("/")
      ? metaEnv.VITE_API_URL.slice(0, -1)
      : metaEnv.VITE_API_URL;
    return `${base}${path}`;
  }
  
  const isStaticHosting = 
    window.location.hostname.includes("github.io") || 
    window.location.hostname.includes("vercel.app") ||
    window.location.hostname.includes("netlify.app") ||
    window.location.hostname.includes("amplifyapp.com") ||
    (!window.location.hostname.includes("run.app") && 
     !window.location.hostname.includes("localhost") && 
     !window.location.hostname.includes("127.0.0.1"));

  if (isStaticHosting) {
    // Automatically fall back to the live public Cloud Run backend URL
    return `https://ais-pre-rqsgkn6k3jdlkdlh7e4s5h-139041493732.asia-southeast1.run.app${path}`;
  }
  return path;
}
