export const getApiEndpoint = () => {
  // Check if we're using the new auth system
  const useAuth = import.meta.env.VITE_USE_AUTH === 'true';
  
  if (useAuth) {
    // Use relative path for Cloudflare Pages Functions
    return '';  // Empty string means same origin
  }
  
  // Fallback to direct API access (legacy mode)
  return 'https://api.anthropic.com';
} 