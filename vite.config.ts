import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const githubPagesBase = '/eveningstar-wesbite/';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? githubPagesBase : '/',
  plugins: [react()],
  build: {
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1800,
    target: 'es2022'
  },
  server: {
    host: '127.0.0.1',
    port: 5173
  },
  preview: {
    host: '127.0.0.1',
    port: 4173
  }
});
