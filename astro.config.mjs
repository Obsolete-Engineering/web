import react from '@astrojs/react';
// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    resolve: {
      dedupe: ['@remotion/player', 'react', 'react-dom', 'remotion'],
    },
  },
});
