import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // Log all environment variables during build
  console.log('🔍 Vite Config - All process.env:', {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    mode: mode,
    command: command,
    allKeys: Object.keys(process.env)
  });

  // Make GitHub environment variables available to the client
  const env = {
    VITE_ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    VITE_OPENAI_API_KEY: process.env.OPENAI_API_KEY
  };

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    define: {
      'import.meta.env.VITE_ANTHROPIC_API_KEY': JSON.stringify(env.VITE_ANTHROPIC_API_KEY),
      'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(env.VITE_OPENAI_API_KEY)
    },
    server: command === 'serve' ? {
      proxy: {
        '/api': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    } : undefined
  };
});