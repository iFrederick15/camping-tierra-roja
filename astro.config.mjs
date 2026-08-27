import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  // Dominio de marca (ver política de privacidad / términos) — actualizar
  // acá el día que se defina el dominio final con/sin "www" en Vercel.
  site: 'https://tierraroja.com.ar',
  // React solo se usa para el widget de reserva (/reservar). El resto del
  // sitio sigue siendo Astro + JS simple, sin cambios.
  integrations: [
    react(),
    sitemap({
      // El panel administrativo y las rutas de API no son contenido público:
      // no deben aparecer en el sitemap (ya están protegidas por auth en
      // middleware.ts, esto además evita que Google intente indexarlas).
      filter: (page) => !page.includes('/panel') && !page.includes('/api/'),
      // `lastmod` = fecha del build. Es una pista de re-rastreo para Google;
      // sin datos por-página, la fecha de deploy es una aproximación válida.
      serialize: (item) => ({ ...item, lastmod: new Date().toISOString() }),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  security: {
    // Sin esto, Astro ignora el header X-Forwarded-Host de Vercel y calcula
    // el origin interno como "localhost", lo que hace que su protección
    // anti-CSRF rechace todos los POST de formularios (ver login del panel)
    // con "Cross-site POST form submissions are forbidden".
    allowedDomains: [
      { hostname: 'camping-tierra-roja.vercel.app' },
      { hostname: 'tierraroja.com.ar' },
      { hostname: 'www.tierraroja.com.ar' },
    ],
  },
});
