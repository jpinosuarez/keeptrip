import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: process.env.VITEST
      ? {
          // En tests, redirigir módulos pesados a stubs livianos para evitar OOM.
          // lucide-react barrel (~2000 iconos) y framer-motion no se tree-shakean
          // en el entorno de Vitest/rolldown-vite.
          'lucide-react': path.resolve(__dirname, '__mocks__/lucide-react.js'),
          'framer-motion': path.resolve(__dirname, '__mocks__/framer-motion.js'),
        }
      : {},
  },
  test: {
    // Setup global
    setupFiles: ['./vitest.setup.js'],
    // Excluir E2E del runner de Vitest
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
