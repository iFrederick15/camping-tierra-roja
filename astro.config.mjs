import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  // React solo se usa para el widget de reserva (/reservar). El resto del
  // sitio sigue siendo Astro + JS simple, sin cambios.
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
