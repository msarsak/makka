import { defineConfig } from 'vite';

export default defineConfig({
  build: { chunkSizeWarningLimit: 2500 }, // die 3D-Erde ist groß, wird aber erst bei Bedarf geladen
  server: {
    port: 5173,
    host: true, // auch im Heimnetz / per Tailscale erreichbar
    proxy: { '/api': 'http://localhost:3000', '/mediapipe': 'http://localhost:3000' },
  },
});
