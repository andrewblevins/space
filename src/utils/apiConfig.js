export const getApiEndpoint = () => {
  if (import.meta.env.PROD) {
    return 'https://api.anthropic.com'
  }
  return '/api'
} 