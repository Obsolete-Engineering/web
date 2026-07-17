import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

const site = process.env.SITE_URL ?? 'https://web-kappa-brown-44.vercel.app';

// https://astro.build/config
export default defineConfig({
  site,
  fonts: [
    {
      name: 'Inter',
      cssVariable: '--font-inter',
      provider: fontProviders.google(),
      weights: [400, 600],
      styles: ['normal'],
      subsets: ['latin'],
      formats: ['woff2'],
      fallbacks: ['sans-serif'],
    },
    {
      name: 'IBM Plex Mono',
      cssVariable: '--font-ibm-plex-mono',
      provider: fontProviders.google(),
      weights: [500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      formats: ['woff2'],
      fallbacks: ['monospace'],
    },
  ],
  integrations: [react(), sitemap()],
  vite: {
    resolve: {
      dedupe: ['@remotion/player', 'react', 'react-dom', 'remotion'],
    },
  },
});
