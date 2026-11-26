import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(import.meta.dirname, 'src/assets'),
      '@components': path.resolve(import.meta.dirname, 'src/components'),
      '@context': path.resolve(import.meta.dirname, 'src/context'),
      '@appFirebase': path.resolve(import.meta.dirname, 'src/firebase'),
      '@hooks': path.resolve(import.meta.dirname, 'src/hooks'),
      '@pages': path.resolve(import.meta.dirname, 'src/pages'),
      '@scenes': path.resolve(import.meta.dirname, 'src/scenes'),
      '@store': path.resolve(import.meta.dirname, 'src/store'),
      '@utils': path.resolve(import.meta.dirname, 'src/utils'),
    },
  },
})
