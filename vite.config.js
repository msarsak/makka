import { defineConfig } from 'vite';

export default defineConfig({
  build: { chunkSizeWarningLimit: 2500 }, // die 3D-Erde ist groß, wird aber erst bei Bedarf geladen
  server: {
    port: 5173,
    host: '127.0.0.1', // nur dieser Laptop – Handy über Tailscale (handy.bat)
    proxy: { '/api': 'http://127.0.0.1:3000', '/mediapipe': 'http://127.0.0.1:3000' },
  },
});
