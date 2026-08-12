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
  security: {
    // Sin esto, Astro ignora el header X-Forwarded-Host de Vercel y calcula
    // el origin interno como "localhost", lo que hace que su protección
    // anti-CSRF rechace todos los POST de formularios (ver login del panel)
    // con "Cross-site POST form submissions are forbidden".
    allowedDomains: [
      { hostname: 'camping-tierra-roja.vercel.app' },
      // Agregar acá el dominio propio (ej. { hostname: 'tierraroja.com.ar' }
      // y su variante con www) cuando se configure en Vercel.
    ],
  },
});
