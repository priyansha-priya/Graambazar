import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// The API runs separately (GramBazar/backend, port 4000 by default). The dev server forwards
// /api there, so the browser sees one origin and the Better Auth session cookie just works.
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:4000';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      // Host header stays localhost:3000 (changeOrigin: false), which is the URL Better Auth
      // is configured with (BETTER_AUTH_URL in backend/.env).
      proxy: {
        '/api': { target: apiTarget, changeOrigin: false },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      proxy: {
        '/api': { target: apiTarget, changeOrigin: false },
      },
    },
  };
});
