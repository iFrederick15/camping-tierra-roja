import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
// Mapa único de rutas por idioma. Se importa (en vez de duplicarlo acá) para
// que el sitemap no pueda desincronizarse de los enlaces del sitio.
import { RUTAS, IDIOMAS, claveDeRuta, normalizarRuta, rutaCanonica } from './src/i18n/config.ts';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  // Dominio de marca (ver política de privacidad / términos) — actualizar
  // acá el día que se defina el dominio final con/sin "www" en Vercel.
  site: 'https://tierraroja.com.ar',
  // ── Idiomas ──
  // Español en la raíz (`/`, `/galeria`, …) porque es el idioma principal y
  // el que ya está indexado; portugués e inglés bajo prefijo (`/pt`, `/en`).
  // Astro expone el idioma resuelto en `Astro.currentLocale`; el mapa de
  // slugs traducidos vive en `src/i18n/config.ts`.
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'pt', 'en'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  // React solo se usa para el widget de reserva (/reservar). El resto del
  // sitio sigue siendo Astro + JS simple, sin cambios.
  integrations: [
    react(),
    sitemap({
      // El panel administrativo y las rutas de API no son contenido público:
      // no deben aparecer en el sitemap (ya están protegidas por auth en
      // middleware.ts, esto además evita que Google intente indexarlas).
      filter: (page) => !page.includes('/panel') && !page.includes('/api/'),
      // No se usa la opción `i18n` del plugin: agrupa las traducciones por
      // sufijo de URL y este sitio tiene los slugs traducidos
      // (/galeria · /pt/galeria · /en/gallery), así que las agruparía mal.
      // Los alternates se arman con el mismo mapa de rutas que usa el <head>.
      serialize: (item) => {
        const ruta = normalizarRuta(new URL(item.url).pathname) || '/';
        const clave = claveDeRuta(ruta);
        return {
          ...item,
          // `lastmod` = fecha del build. Es una pista de re-rastreo para
          // Google; sin datos por-página, la fecha de deploy es una
          // aproximación válida.
          lastmod: new Date().toISOString(),
          // Solo las páginas que existen en los tres idiomas declaran
          // alternates; las legales (solo en español) no.
          links: clave
            ? IDIOMAS.map(({ codigo, hreflang }) => ({
                lang: hreflang,
                url: new URL(rutaCanonica(RUTAS[codigo][clave]), 'https://tierraroja.com.ar').href,
              }))
            : undefined,
        };
      },
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
