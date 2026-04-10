import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: command === 'serve' ? {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      // VAULT: proxy /vault/* to the local sidecar started by `dev:vault`.
      // The sidecar requires an Origin header matching http://localhost:3000,
      // which browser fetches already send automatically.
      '/vault': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: false,
      }
    }
  } : undefined
}))