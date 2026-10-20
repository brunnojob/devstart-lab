import { defineConfig } from 'vite';

export default defineConfig({
  base: '/devstart-lab/',
  build: {
    sourcemap: false,
    minify: true
  }
});
