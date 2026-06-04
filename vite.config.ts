import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: resolve(__dirname, 'src/manifest.json'),
      browser: 'chromium',
      additionalInputs: [
        'src/background/service-worker.ts',
        'src/content/content-script.ts',
      ],
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
