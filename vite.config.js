import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/basketball-tracker/',
  server: {
    host: true,  // or use '0.0.0.0'
    port: 5173
  }
});
