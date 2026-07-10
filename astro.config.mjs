import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// ─── GitHub Pages Configuration ───────────────────────────────────────────────
// Cambia 'TU_USUARIO' por tu nombre de usuario en GitHub
// Cambia 'ParaisoDelFutbol' por el nombre EXACTO de tu repositorio en GitHub
const GITHUB_USER = 'valenblack20';
const GITHUB_REPO = 'paraisodelfutbol';

// ─── Astro Config ─────────────────────────────────────────────────────────────
export default defineConfig({
  // Para GitHub Pages: https://TU_USUARIO.github.io/ParaisoDelFutbol
  site: `https://${GITHUB_USER}.github.io`,
  base: `/${GITHUB_REPO}`,

  // GitHub Pages solo soporta sitios estáticos (no SSR)
  output: 'static',

  integrations: [tailwind()],
});
