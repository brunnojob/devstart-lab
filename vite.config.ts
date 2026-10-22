import { defineConfig } from 'vite';

export default defineConfig({
  base: '/devstart-lab/',
  server: { allowedHosts: ['terminal.local'] },
  build: {
    sourcemap: false,
    minify: true
  }
});
