import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// ─── Astro Config ─────────────────────────────────────────────────────────────
export default defineConfig({
  site: 'https://paraisofutbol.com',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [tailwind()],
});
