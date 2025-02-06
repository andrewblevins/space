import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  console.log('Vite config mode:', mode);
  
  // For local development, these will come from .dev.vars
  // For production/preview, these will come from Cloudflare Pages environment variables
  const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
  const openaiKey = process.env.OPENAI_API_KEY || '';
  
  console.log('Building with keys:', {
    anthropicExists: !!anthropicKey,
    openaiExists: !!openaiKey,
    anthropicLength: anthropicKey?.length || 0,
    openaiLength: openaiKey?.length || 0
  });

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    server: command === 'serve' ? {
      proxy: {
        '/api': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    } : undefined,
    define: {
      // Make environment variables available at runtime
      'process.env.ANTHROPIC_API_KEY': JSON.stringify(anthropicKey),
      'process.env.OPENAI_API_KEY': JSON.stringify(openaiKey)
    }
  };
});