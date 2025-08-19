export const getApiEndpoint = (provider = 'anthropic') => {
  // Check if we're using the new auth system
  const useAuth = import.meta.env.VITE_USE_AUTH === 'true';
  
  if (useAuth) {
    // Use relative path for Cloudflare Pages Functions
    return '';  // Empty string means same origin
  }
  
  // Fallback to direct API access (legacy mode)
  switch (provider) {
    case 'openrouter':
      return 'https://openrouter.ai';
    case 'anthropic':
    default:
      return 'https://api.anthropic.com';
  }
} 