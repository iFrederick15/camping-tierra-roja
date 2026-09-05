# Datos pendientes de completar — Camping Tierra Roja

Este archivo lista **la información que la web pide y todavía no está
confirmada**. Nada de esto está inventado en el sitio: donde falta un dato, la
página muestra un texto neutro ("Consultar precio", "Consulta el tiempo de
viaje") o una nota visible marcada como pendiente.

Cada punto dice **qué archivo editar** y qué pasa cuando se completa.

---

## 1. Precios · `src/lib/precios.ts`

```ts
CAMPING:   { desde: null }  // ⚠️ COMPLETAR
MOTORHOME: { desde: null }  // ⚠️ COMPLETAR
CABANA:    { desde: null }  // ⚠️ COMPLETAR
export const VIGENCIA_PRECIOS: string | null = null;
```

Poner el **valor mínimo por noche en pesos** de cada tipo de alojamiento y la
temporada de vigencia (ej. `'Temporada 2026'`).

- Camping se cobra **por persona y por noche**.
- Motorhome, **por vehículo y por noche**, incluye 2 personas.
- Cabaña, **precio fijo por noche** hasta 8 personas.

Mientras sean `null`, la sección "Precios desde" muestra "Consultar precio" con
enlace a WhatsApp, y el `priceRange` de schema.org queda en `$$`.

> Esto **no** reemplaza los precios del Panel Admin: el cobro real lo sigue
> calculando el widget de reserva contra Supabase. Este archivo es solo el
> "desde" de marketing de la landing.

---

## 2. Distancias · `src/lib/ubicacion.ts`

Confirmados y ya publicados (venían de la página de Contacto):

- Cataratas del Iguazú — 20 min
- Centro de Puerto Iguazú — 20 min

Faltan (hoy muestran "Consulta el tiempo de viaje" en vez de un número):

| Punto | Campo a completar |
|---|---|
| Frontera con Brasil (Puente Tancredo Neves) | `minutos`, `confirmado: true` |
| Foz do Iguaçu (centro) | `minutos`, `confirmado: true` |
| Aeropuerto de Puerto Iguazú (IGR) | `minutos`, `confirmado: true` |
| Hito Tres Fronteras | `minutos`, `confirmado: true` |

Los dos primeros son los más importantes: son el argumento de venta para el
visitante brasileño, que es el segundo público del camping.

---

## 2 bis. Guía de atractivos · `src/lib/atractivos.ts`

La sección Ubicación publica las 34 fichas del descriptivo oficial "Atractivos
Iguazú" (ACATI), edición del 29/06/2026, con el mismo número que llevan en el
mapa impreso. Tierra Roja es la número 26.

Decisiones tomadas al cargarlo, por si hay que revisarlas:

- **No se copiaron teléfonos, mails ni webs de cada prestador.** Son datos de
  terceros que cambian y quedarían viejos sin que nadie se entere; la web
  enlaza una sola vez a `atractivosiguazu.com`. Si se quieren los contactos,
  hay que transcribirlos verificando ficha por ficha contra el folleto.
- **Los logos** (`public/images/atractivos/NN.webp`, uno por número de mapa) se
  recortaron de la página 1 del PDF con `scripts/logos-atractivos.mjs`. Si sale
  una edición nueva del folleto, se vuelve a correr:
  `node scripts/logos-atractivos.mjs "~/Downloads/Descriptivo … .pdf"`, y se
  revisan los recortes intermedios que deja en /tmp antes de commitear. Son
  marcas de cada prestador: si alguno pide que se saque la suya, se borra el
  archivo y se marca la ficha con `sinLogo: true` (la tarjeta vuelve al
  número del mapa).
- **El número 31 no existe** en esa edición del descriptivo: no es un olvido.
- Las categorías son las cinco de la leyenda del mapa (naturaleza, cultura,
  aventura, recreativo, compras); la asignación de cada atractivo se hizo por
  la actividad que describe su propia ficha.
- Cuando la ACATI publique una edición nueva hay que actualizar las fichas y la
  fecha del pie de la sección (clave `ubicacion.atractivos.fuente` en los tres
  diccionarios de `src/i18n/`).

---

## 3. Respuestas del FAQ · `src/i18n/es.ts`, `pt.ts`, `en.ts` (clave `faq.items`)

Tres respuestas tienen un bloque `[COMPLETAR: …]`. En la web aparecen como una
**nota amarilla visible** debajo de la respuesta, y esas preguntas **no se
publican** en el FAQPage de schema.org hasta que estén completas.

1. **"¿Se puede entrar solo por el día?"** — confirmar si existe entrada por día
   al parque acuático sin alojarse, su precio y su horario.
2. **"¿Cómo llego desde Brasil o desde Foz do Iguaçu?"** — tiempo de viaje
   aproximado desde el centro de Foz y desde el paso fronterizo (mismo dato que
   el punto 2 de arriba).
3. **"¿Cómo se paga?"** — qué medios de pago se aceptan en recepción (efectivo
   en pesos, reales brasileños, tarjetas).

Al completar una, hay que **borrar el bloque `[COMPLETAR: …]`** y escribir la
respuesta en los **tres idiomas**.

---

## 4. Reseñas de Google (API) · `src/lib/resenas.ts`

La conexión con la Google Places API ya está implementada
(`obtenerResenas()` en `src/lib/resenas.ts`): trae rating, cantidad y hasta 5
reseñas reales en vivo, con caché de 12h. Mientras falten las credenciales,
el sitio sigue funcionando con el listado estático de 5 reseñas de respaldo
(mismo componente, mismo schema.org) — no hay nada roto, solo no se
actualiza solo.

Para activarla, agregar en Vercel → Project Settings → Environment Variables
(y en `.env` local):

```
GOOGLE_PLACES_API_KEY=  # API key con "Places API (New)" habilitada
GOOGLE_PLACE_ID=        # Place ID de Tierra Roja
```

Pasos para conseguirlas:
1. Crear/usar un proyecto en Google Cloud Console, habilitar **Places API
   (New)** y activar facturación (hay franja gratuita mensual).
2. Generar una API key y restringirla a esa API.
3. Buscar "Tierra Roja" en el
   [Place ID Finder de Google](https://developers.google.com/maps/documentation/places/web-service/place-id)
   para obtener el Place ID.

Una vez cargadas ambas variables, el `perfilUrl` (enlace "Ver todas") y las
reseñas se completan solos desde la respuesta de la API — no hace falta
tocar código. Límite conocido: la API devuelve como máximo 5 reseñas,
elegidas por Google (no siempre las más nuevas).

---

## 5. Analítica · variables de entorno en Vercel

El sitio **no carga ningún script de terceros hoy**. Los eventos de conversión
ya se disparan a `window.dataLayer` (se pueden ver en la consola del navegador):

`reservar_click` · `whatsapp_click` · `telefono_click` · `email_click` ·
`idioma_click` · `alojamiento_click` · `contacto_enviado` · `faq_abierta` ·
`mapa_click`

Para activar Google Tag Manager:

1. Definir `GTM_ID` (formato `GTM-XXXXXXX`) en Vercel. Sin prefijo `PUBLIC_`.
2. Agregar a `vercel.json` → `Content-Security-Policy`:
   - `script-src` … `https://www.googletagmanager.com`
   - `connect-src` … `https://www.google-analytics.com https://*.analytics.google.com`
3. Nada más: el snippet ya está escrito en `src/components/Analytics.astro` y
   se activa solo cuando la variable existe.

---

## 6. Fotos · `src/lib/galeria.ts`

La galería usa solo fotos reales del predio (13). Faltan, y sumarían mucho:

- interiores de la cabaña (habitaciones, cocina, baño),
- sanitarios y duchas del camping (aparecen elogiados en varias reseñas),
- proveeduría / kiosco, si existe,
- fotos con gente disfrutando (familias en las piscinas): son las que mejor
  convierten en turismo.

Al agregar una foto hay que sumar su descripción en `galeria.fotos` de los
**tres** diccionarios de idioma, en el mismo orden que el array `FOTOS`.

---

## 7. Pendientes que ya venían de la auditoría SEO anterior

Siguen abiertos y requieren accesos externos:

- **Dominio**: conectar `tierraroja.com.ar` en Vercel y configurar los 301 de
  `www` → apex y de `*.vercel.app` → dominio final.
- **Google Search Console**: verificar el dominio y enviar
  `https://tierraroja.com.ar/sitemap-index.xml`.
- **Resend**: `RESEND_API_KEY` y dominio verificado para que funcione el
  formulario de contacto (`/api/contacto`).
- **`src/lib/email.ts`**: `enviarEmailConfirmacion` todavía tiene `[COMPLETAR]`
  en los datos bancarios de la seña y en el WhatsApp de contacto.

---

## 8. Limitación conocida: textos que vienen de la base de datos

En `/pt/reservar` y `/en/book`, las **etiquetas de los ítems de precio** que
devuelve `/api/precios` salen de Supabase y las edita el administrador desde el
Panel, siempre en español. Para portugués e inglés hay una traducción por clave
en `src/i18n/reservar-widget.ts` (`opcionesPrecio`).

Si se crea un ítem de precio nuevo desde el Panel, hay que agregar su clave a
ese mapa; mientras tanto se muestra el texto en español (nunca vacío).

Lo mismo aplica a los mensajes de error que devuelve el servidor y a los
correos de confirmación: siguen siendo en español.
