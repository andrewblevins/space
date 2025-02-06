import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  console.log('Vite config mode:', mode);
  
  // Get environment variables at build time
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!anthropicKey || !openaiKey) {
    console.error('Missing required environment variables during build');
  }
  
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
      // Inject as global constants
      __ANTHROPIC_KEY__: JSON.stringify(anthropicKey || ''),
      __OPENAI_KEY__: JSON.stringify(openaiKey || '')
    }
  };
});