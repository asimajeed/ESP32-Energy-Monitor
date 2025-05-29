import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import viteCompression from 'vite-plugin-compression';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1025,
      deleteOriginFile: true,
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: '../firmware/data',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name][extname]`,
      },
    },
  },
})
