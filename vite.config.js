import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    wasm(), // Enable WASM support
    topLevelAwait(), // Allow top-level await
  ],
  build: {
    target: 'esnext', // Ensure WASM is supported in modern browsers
  },
  resolve: {
    alias: {
      '@wasm': '/path/to/your/wasm/files', // Ensure correct path for WASM
    },
  },
});
