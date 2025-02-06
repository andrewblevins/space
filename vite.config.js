import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  console.log('Vite config mode:', mode);
  console.log('Environment variables:', {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY
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
      'import.meta.env.ANTHROPIC_API_KEY': JSON.stringify(process.env.ANTHROPIC_API_KEY),
      'import.meta.env.OPENAI_API_KEY': JSON.stringify(process.env.OPENAI_API_KEY)
    }
  };
})