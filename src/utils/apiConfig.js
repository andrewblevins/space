export const getApiEndpoint = () => {
  // In both dev and prod, we want to use the /api route
  // which will be handled by Cloudflare Functions in prod
  // and the Vite dev server proxy in development
  return '/api'
} 