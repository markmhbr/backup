export const getFotoUrl = (path: string | null | undefined, fallback: string = "/images/default/profile.jpg"): string => {
  if (!path) return fallback;
  if (path.startsWith("http")) {
    return path.includes('?') ? `${path}&t=${Date.now()}` : `${path}?t=${Date.now()}`;
  }
  const baseUrl = import.meta.env.VITE_API_URL 
    ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL.slice(0, -4) : import.meta.env.VITE_API_URL)
    : (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
  
  const fullPath = path.startsWith("/storage") ? `${baseUrl}${path}` : `${baseUrl}/storage/${path}`;
  return fullPath.includes('?') ? `${fullPath}&t=${Date.now()}` : `${fullPath}?t=${Date.now()}`;
};

export const getLogoUrl = (path: string | null | undefined): string => {
  return getFotoUrl(path, "");
};
