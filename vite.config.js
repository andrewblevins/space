import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  console.log('Vite config mode:', mode);
  
  // Define constants that will be replaced at build time
  const __ANTHROPIC_KEY__ = '';  // Will be injected by Cloudflare
  const __OPENAI_KEY__ = '';     // Will be injected by Cloudflare
  
  console.log('Building with keys:', {
    anthropicExists: !!__ANTHROPIC_KEY__,
    openaiExists: !!__OPENAI_KEY__,
    anthropicLength: __ANTHROPIC_KEY__?.length || 0,
    openaiLength: __OPENAI_KEY__?.length || 0
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
      // These will be replaced at build time by Cloudflare Pages
      __ANTHROPIC_KEY__: JSON.stringify(__ANTHROPIC_KEY__),
      __OPENAI_KEY__: JSON.stringify(__OPENAI_KEY__)
    }
  };
});