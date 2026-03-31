import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
