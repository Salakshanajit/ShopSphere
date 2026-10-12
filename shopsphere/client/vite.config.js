import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The browser calls "/api/..." on the Vite server (port 5173). Vite forwards those
// calls to the Express backend, so there are no CORS problems during development.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.VITE_PROXY_TARGET || 'http://localhost:5000';
  const proxy = { '/api': { target: backend, changeOrigin: true } };

  return {
    plugins: [react()],
    server: { port: 5173, strictPort: true, proxy },
    preview: { port: 5173, proxy },
  };
});
