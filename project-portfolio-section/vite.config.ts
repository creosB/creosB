import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2015',
    cssMinify: true,
  },
  server: {
    port: 5173,
    open: true,
  },
})
