export const getFotoUrl = (path: string | null | undefined, fallback: string = "/images/default/profile.jpg"): string => {
  if (!path) return fallback;
  
  // If it's an external absolute URL that doesn't target our own storage, return it directly
  if (path.startsWith("http") && !path.includes("/storage")) {
    return path;
  }
  
  const baseUrl = import.meta.env.VITE_API_URL 
    ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL.slice(0, -4) : import.meta.env.VITE_API_URL)
    : (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
  
  // Extract path portion starting with /storage if there's any absolute URL in it
  let cleanPath = path;
  const storageIndex = path.indexOf('/storage/');
  if (storageIndex !== -1) {
    cleanPath = path.substring(storageIndex);
  }
  
  let fullPath = cleanPath.startsWith("/storage") ? `${baseUrl}${cleanPath}` : `${baseUrl}/storage/${cleanPath}`;
  
  // Clean old token parameter if any and append the fresh one from localStorage
  const token = localStorage.getItem('auth_token');
  if (token) {
    const urlWithoutToken = fullPath.replace(/([?&])token=[^&]*(&|$)/, '$1').replace(/[?&]$/, '');
    const separator = urlWithoutToken.includes('?') ? '&' : '?';
    fullPath = `${urlWithoutToken}${separator}token=${token}`;
  }
  
  return fullPath;
};

export const getLogoUrl = (path: string | null | undefined): string => {
  return getFotoUrl(path, "");
};
