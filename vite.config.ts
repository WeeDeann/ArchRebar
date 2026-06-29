/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/** GitHub project repo name — used as the Pages subpath (https://user.github.io/ArchRebar/). */
const REPO = 'ArchRebar';
const pagesBase = `/${REPO}/`;

export default defineConfig(({ mode }) => {
  const isPages = mode === 'pages';

  return {
  base: isPages ? pagesBase : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'ArchRebar — Arch Rebar Calculator',
        short_name: 'ArchRebar',
        description: 'Radius, cutting length, and shop-floor QC checks from chord and rise.',
        theme_color: '#0b6b4f',
        background_color: '#eef0ec',
        display: 'standalone',
        orientation: 'any',
        start_url: isPages ? pagesBase : '/',
        scope: isPages ? pagesBase : '/',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  };
});
