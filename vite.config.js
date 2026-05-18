import path from "path"
import { fileURLToPath } from "url"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// [L-9] ESM module di Vite tidak punya __dirname global. Compute dari
// import.meta.url supaya path.resolve di alias bekerja dengan benar.
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-pdf') || id.includes('pdfjs-dist')) {
              return 'pdf-vendor';
            }
            if (id.includes('lucide-react') || id.includes('react-draggable')) {
              return 'ui-vendor';
            }
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Meningkatkan limit peringatan menjadi 1MB setelah splitting
  },
})
