import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      // Add this alias if you keep files in src/contracts/
      '@/contracts': '/src/contracts'
    }
  }
});