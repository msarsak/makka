import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    host: true, // auch im Heimnetz / per Tailscale erreichbar
    proxy: { '/api': 'http://localhost:3000' },
  },
});
