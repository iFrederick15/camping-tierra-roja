# Auditoría SEO técnica — Camping Tierra Roja

**Fecha:** 2026-08-27
**Alcance:** auditoría estática sobre el código del repositorio y el output de `astro build` (`dist/`, `.vercel/output/`). No incluye datos de campo.
**Stack detectado:** Astro 5.7 (`output: 'server'`, adapter `@astrojs/vercel`) + React 18 (solo el widget `/reservar`) + Tailwind 4 + Supabase. Sitemap con `@astrojs/sitemap`.

---

## 1. Resumen ejecutivo

El sitio tiene una base técnica **razonablemente sólida**: casi todas las páginas públicas son estáticas (`prerender = true`), cada una lleva `<title>` y `meta description` únicos, canonical self-referencing, Open Graph, Twitter Card y un JSON-LD `Campground` bien formado. El sitemap se genera y excluye correctamente `/panel` y `/api`; el `robots.txt` es coherente.

Sin embargo hay problemas que impiden un buen desempeño:

1. **`/contacto` está publicada con texto placeholder "Lorem ipsum"** y strings en inglés — contenido de baja calidad en una URL indexable y en el sitemap.
2. **Inconsistencia de dominio y de NAP.** El código mezcla tres dominios (`tierraroja.com.ar`, `camping-tierra-roja.vercel.app`, `tierrarojaiguazu.com`) y `/contacto` muestra una dirección distinta ("Av. de las Cataratas") a la del resto del sitio ("Barrio Los Yerbales"). Riesgo para indexación y para SEO local.
3. **`og:image` en formato WebP:** Facebook/WhatsApp no renderizan la previsualización, justo el canal principal de difusión del negocio.
4. **Imágenes de stock de terceros (Unsplash / googleusercontent) presentadas como fotos del camping** en Galería y Contacto; una de ellas es una URL efímera que va a devolver 404.
5. **Core Web Vitals en riesgo:** ninguna `<img>` declara `width`/`height` (CLS), el Hero carga dos imágenes grandes en `eager`, y las fuentes se cargan de forma redundante y bloqueante.

Además, faltan una página **404 propia** y el elemento semántico **`<main>`**.

**Fuera del alcance de esta auditoría estática** (requiere acceso externo): backlinks y autoridad de dominio, posicionamiento real en buscadores, Core Web Vitals de campo (CrUX), si `tierraroja.com.ar` resuelve / tiene SSL / es el dominio de producción en Vercel, cabeceras HTTP reales de respuesta (compresión, `Cache-Control`, HSTS), cobertura en Google Search Console y estado del perfil de Google Business.

---

## 2. Hallazgos por prioridad

### 🔴 CRÍTICO

---

#### C-1. Contenido placeholder "Lorem ipsum" e inglés en una página indexable

- **Archivos:** [src/components/Contacto.astro:13-22](src/components/Contacto.astro#L13-L22) (párrafo Lorem ipsum), [src/components/Contacto.astro:127](src/components/Contacto.astro#L127) (`alt="Tropical Waterfall"`), [src/components/Contacto.astro:139](src/components/Contacto.astro#L139) (`"The heart of the rainforest."`)
- **Problema:** `/contacto` está en el sitemap y es indexable, pero su texto principal es relleno latino y contiene cadenas en inglés. Google evalúa calidad a nivel de sitio; una página así arrastra la percepción de todo el dominio y puede terminar en "Rastreada, actualmente sin indexar".
- **Impacto SEO:** alto. Pérdida de relevancia para "contacto camping Iguazú / cómo llegar", señal de sitio inacabado, mala primera impresión para usuarios que llegan por marca.
- **Recomendación:** reemplazar el párrafo por 2-3 frases reales (ubicación respecto de Puerto Iguazú y las Cataratas, horarios de atención, canales de contacto y tiempos de respuesta). Traducir/rehacer el `alt` y el caption de la imagen. Revisar toda la página buscando texto de plantilla antes de volver a desplegar.

---

#### C-2. Inconsistencia de dominio canónico — no verificable que el dominio de producción coincida

- **Archivos:** [astro.config.mjs:12](astro.config.mjs#L12) (`site: 'https://tierraroja.com.ar'`), [astro.config.mjs:32-37](astro.config.mjs#L32-L37) (`allowedDomains` sólo incluye `camping-tierra-roja.vercel.app`), [src/layouts/Layout.astro:20](src/layouts/Layout.astro#L20) (fallback a un tercer dominio `tierrarojaiguazu.com`)
- **Problema:** todos los `<link rel="canonical">`, `og:url` y las URLs del sitemap y del `robots.txt` apuntan a `https://tierraroja.com.ar/…`. Si la web hoy se sirve desde `camping-tierra-roja.vercel.app` (único dominio declarado como confiable), entonces cada página en producción declara como canónica una URL de otro host. Google puede: (a) ignorar el canonical y indexar el `.vercel.app`, generando duplicación de dominio, o (b) descartar páginas si `tierraroja.com.ar` no responde.
- **Impacto SEO:** crítico mientras el dominio final no esté conectado y con redirección 301 del resto de variantes.
- **Recomendación:**
  1. Verificar en Vercel qué dominio es el de producción. **(requiere acceso a Vercel — fuera del alcance del código).**
  2. Cuando `tierraroja.com.ar` sea el definitivo: añadirlo (y su variante `www`) a `allowedDomains` en [astro.config.mjs:34-36](astro.config.mjs#L34-L36), configurar en Vercel el redirect 301 de `www` → apex (o viceversa) y de `*.vercel.app` → dominio final.
  3. Unificar el dominio de marca en un único lugar y eliminar el fallback `tierrarojaiguazu.com` de [src/layouts/Layout.astro:20](src/layouts/Layout.astro#L20).

---

#### C-3. NAP inconsistente: la dirección de /contacto no coincide con el resto del sitio

- **Archivos:** [src/components/Contacto.astro:91](src/components/Contacto.astro#L91) → *"Av. de las Cataratas 2000 Ha, Puerto Iguazú"* vs. [src/layouts/Layout.astro:42-43](src/layouts/Layout.astro#L42-L43), [src/components/Footer.astro:170](src/components/Footer.astro#L170) y las páginas legales → *"Barrio Los Yerbales 2000 Ha, Puerto Iguazú"*
- **Problema:** el NAP (Name-Address-Phone) debe ser idéntico en todas las apariciones para SEO local. Aquí hay dos calles distintas para el mismo predio. El JSON-LD `PostalAddress` usa "Barrio Los Yerbales" pero la página de contacto (la que el usuario y Google leen para ubicar el negocio) dice otra cosa.
- **Impacto SEO:** alto para local pack / Google Maps. Señal de dirección ambigua, reduce confianza del algoritmo local y puede desalinear con el perfil de Google Business.
- **Recomendación:** definir la dirección oficial única y replicarla textualmente en: `Contacto.astro`, `Footer.astro`, JSON-LD (`streetAddress`), páginas legales y perfil de Google Business. Idealmente extraer la dirección a una constante compartida (p. ej. `src/lib/negocio.ts`) para que no vuelva a divergir.

---

### 🟠 ALTO

---

#### A-1. `og:image` en formato WebP — sin previsualización en Facebook / WhatsApp

- **Archivos:** [src/layouts/Layout.astro:15](src/layouts/Layout.astro#L15) (`image = '/images/tierra-roja-drone.webp'`), usado en [src/layouts/Layout.astro:85](src/layouts/Layout.astro#L85) y [:91](src/layouts/Layout.astro#L91)
- **Problema:** el scraper de Open Graph de Facebook/WhatsApp no soporta WebP de forma fiable; el enlace compartido aparece sin miniatura. El propio comentario del código dice *"Open Graph (WhatsApp, Instagram, Facebook)"*, que es el canal de difusión principal de un camping.
- **Impacto SEO/CTR:** alto en tráfico social y de mensajería (no es ranking orgánico, pero sí clics).
- **Recomendación:**
  - Cambiar el default a `/images/tierra-roja-drone.jpg` (ya existe en `public/images/`), ~1200×630 px, < 300 KB.
  - Añadir `<meta property="og:image:width" content="1200">`, `og:image:height`, `og:image:type` y `og:image:alt`.
  - Verificar con el Sharing Debugger de Facebook tras el deploy.

---

#### A-2. Imágenes de stock de terceros presentadas como fotos propias

- **Archivos:** [src/components/Galeria.astro:25](src/components/Galeria.astro#L25), [:30](src/components/Galeria.astro#L30), [:41](src/components/Galeria.astro#L41), [:46](src/components/Galeria.astro#L46), [:52](src/components/Galeria.astro#L52), [:57](src/components/Galeria.astro#L57) (Unsplash); [src/components/Contacto.astro:130](src/components/Contacto.astro#L130) (`lh3.googleusercontent.com/aida-public/…`)
- **Problema:**
  1. Son fotos genéricas de otros lugares mostradas con títulos como *"Interior de nuestra cabaña"* o *"Piscina de relax"* → contenido engañoso; degrada E-E-A-T y la confianza del usuario.
  2. Se cargan por hotlink desde dominios externos: latencia extra, dependencia de terceros, y la URL `aida-public` de googleusercontent es **temporal** (se romperá y disparará el `onerror` de [Galeria.astro:116](src/components/Galeria.astro#L116), que además reemplaza por `/images/camping.jpg`, otra foto no relacionada).
  3. No aportan valor de indexación de imágenes (no están en el dominio, no se pueden optimizar).
- **Impacto SEO:** medio-alto. Sin fotos reales, la galería no genera tráfico de Google Imágenes ni refuerza la relevancia local; el riesgo de imágenes rotas es una señal de mantenimiento pobre.
- **Recomendación:** sustituir por fotografías reales del predio, alojadas en `public/images/` (o vía `astro:assets`), con `alt` descriptivo y específico. Si aún no hay material, reducir la galería a las fotos disponibles en lugar de rellenar con stock.

---

#### A-3. Ninguna `<img>` declara `width` / `height` → CLS

- **Archivos:** todos los componentes con imágenes — [src/components/Hero.astro:14](src/components/Hero.astro#L14),[:57](src/components/Hero.astro#L57),[:69](src/components/Hero.astro#L69); [src/components/Piscinas.astro:48](src/components/Piscinas.astro#L48); [src/components/Camping.astro:12](src/components/Camping.astro#L12),[:45](src/components/Camping.astro#L45); [src/components/Cabanas.astro:41](src/components/Cabanas.astro#L41); [src/components/Galeria.astro:110](src/components/Galeria.astro#L110); [src/components/Navbar.astro:14](src/components/Navbar.astro#L14); [src/components/Footer.astro:19](src/components/Footer.astro#L19); [src/pages/reservar.astro:10](src/pages/reservar.astro#L10)
- **Problema:** sin dimensiones intrínsecas el navegador no reserva espacio antes de descargar la imagen → *Cumulative Layout Shift*. Los wrappers Tailwind (`aspect-[8/5]`, etc.) ayudan pero el elemento `<img>` sigue sin `width`/`height`, y el logo del Navbar/Footer no tiene wrapper con aspect ratio.
- **Impacto SEO:** medio-alto. CLS es factor de ranking (Core Web Vitals); un logo o una imagen del Hero que "empuja" el contenido penaliza en móvil.
- **Recomendación:** migrar las imágenes locales a `import` + componente `<Image>` de `astro:assets` (genera `width`, `height`, `srcset`, AVIF/WebP y `loading` automáticamente). Como mínimo, añadir `width` y `height` explícitos a cada `<img>`.

---

#### A-4. Formulario de contacto no funcional

- **Archivo:** [src/components/Contacto.astro:30-77](src/components/Contacto.astro#L30-L77)
- **Problema:** el `<form>` no tiene `action` ni `method`, los `<input>/<textarea>` no tienen atributo `name` ni `id`, los `<label>` no están asociados (`for`/`id`), no hay handler JS y la etiqueta del mensaje está cortada: *"Mensa"* ([:65](src/components/Contacto.astro#L65)). El formulario no envía nada.
- **Impacto SEO:** indirecto pero real. Pérdida total de conversión desde la página de contacto; señal de página inacabada (ver C-1); problemas de accesibilidad (labels sin asociar) que también pesan en la evaluación de calidad de página.
- **Recomendación:** conectar el formulario a un endpoint real (ya existe `resend` en las dependencias y `src/lib/email.ts`): crear `src/pages/api/contacto.ts`, añadir `name`/`id`/`required` a los campos, asociar labels con `for`, corregir "Mensa" → "Mensaje", y mostrar estado de éxito/error. Alternativa rápida: mientras tanto, ocultar el formulario y dejar solo WhatsApp/email/mapa (que sí funcionan).

---

#### A-5. H1 poco descriptivos en Home y Contacto

- **Archivos:** [src/components/Hero.astro:28-36](src/components/Hero.astro#L28-L36) → *"Bienvenido a Camping Tierra Roja"*; [src/components/Contacto.astro:6-11](src/components/Contacto.astro#L6-L11) → *"Conectemos con la naturaleza."*
- **Problema:** el H1 de la home no incluye la propuesta ni la localidad ("parque acuático", "Puerto Iguazú", "Misiones"); el de contacto es puramente decorativo. El `<title>` sí está bien optimizado, pero el H1 es una señal on-page separada y la oportunidad de keyword se desaprovecha.
- **Impacto SEO:** medio. Menos relevancia para "camping y parque acuático en Puerto Iguazú" y variantes.
- **Recomendación:** Home H1 → algo como *"Camping y parque acuático en Puerto Iguazú"* (con el naming de marca como subtítulo/`<p>`). Contacto H1 → *"Contacto y cómo llegar — Camping Tierra Roja, Puerto Iguazú"*. Mantener el estilo visual con `<span>` internos.

---

### 🟡 MEDIO

---

#### M-1. No existe página 404 propia

- **Evidencia:** no hay `src/pages/404.astro`; `dist/client/` no contiene `404.html`; `.vercel/output/config.json` no define ruta catch-all.
- **Problema:** las URLs inexistentes muestran el 404 genérico de Vercel, sin navegación ni marca. (El status HTTP 404 sí es correcto, no es un soft-404).
- **Impacto SEO:** bajo-medio. Peor recuperación de usuarios que llegan a URLs rotas / cambiadas; oportunidad perdida de enlazado interno.
- **Recomendación:** crear `src/pages/404.astro` usando `Layout`, con mensaje breve y enlaces a Home, Galería, Reservar y Contacto.

---

#### M-2. Falta el elemento semántico `<main>`

- **Archivo:** [src/layouts/Layout.astro:112-116](src/layouts/Layout.astro#L112-L116) — el `<body>` contiene `<Navbar />`, `<slot />`, `<Footer />` sin envolver el contenido en `<main>`.
- **Problema:** no hay landmark de contenido principal. Afecta accesibilidad (lectores de pantalla, "saltar al contenido") y la comprensión del contenido primario por parte de los rastreadores.
- **Impacto SEO:** bajo-medio (más accesibilidad que ranking directo, pero ambas se solapan en la evaluación de calidad de página).
- **Recomendación:** envolver el `<slot />` en `<main id="contenido">`. Revisar que el Hero use `<section>` en vez de un segundo `<header>` ([src/components/Hero.astro:6](src/components/Hero.astro#L6)) para no duplicar el landmark `banner`.

---

#### M-3. Carga de fuentes redundante y bloqueante

- **Archivos:** [src/layouts/Layout.astro:98-106](src/layouts/Layout.astro#L98-L106) (2 `<link>` a Google Fonts CSS: familia de texto + Material Symbols) y [src/styles/global.css:39-52](src/styles/global.css#L39-L52) (`@font-face` de Ubuntu 400/700 apuntando a `fonts.gstatic.com`).
- **Problema:**
  - Ubuntu se declara **dos veces** (en `@font-face` propio y dentro del `<link>` `family=Ubuntu:wght@400;500;700`).
  - `DM Sans` (fuente de cuerpo) y `Petemoss` sólo llegan por el `<link>` render-blocking.
  - `Material Symbols Outlined` se carga como fuente de iconos completa para unos pocos iconos decorativos (menú, flechas, check).
  - Todo desde dominios externos (2 orígenes extra + `preconnect`).
- **Impacto SEO:** medio. Afecta LCP (texto que espera a la fuente) y añade requests bloqueantes; penaliza en móvil.
- **Recomendación:** self-hostear los `.woff2` de Ubuntu, DM Sans y Petemoss subseteados a `latin` dentro de `public/fonts/`, con un único bloque `@font-face` y `font-display: swap`; añadir `<link rel="preload" as="font" crossorigin>` para la fuente del primer render. Reemplazar Material Symbols por SVGs inline (ya se usan SVGs inline en el Footer, unificar el criterio). Eliminar la declaración duplicada de Ubuntu.

---

#### M-4. Datos estructurados: solo `Campground`, faltan tipos de alto valor

- **Archivo:** [src/layouts/Layout.astro:25-63](src/layouts/Layout.astro#L25-L63)
- **Problema / oportunidades:**
  - `telephone: '+54 3757 31-7593'` ([:36](src/layouts/Layout.astro#L36)) no está en formato E.164 (`+543757317593`).
  - No hay `priceRange`, `openingHoursSpecification` (el texto dice "opera todo el año"), ni `hasMap`.
  - Las **Normas del Parque** ([src/pages/normas-del-parque.astro](src/pages/normas-del-parque.astro)) son un candidato perfecto para `FAQPage` (10 secciones pregunta/respuesta) → posible rich result.
  - Sin `BreadcrumbList` en ninguna página interior.
  - El JSON-LD sólo se emite con datos del negocio; se repite idéntico en todas las páginas (correcto para `@id`, pero se podría enriquecer por tipo de página).
- **Impacto SEO:** medio. Menos superficie para resultados enriquecidos y para Knowledge Panel / Maps.
- **Recomendación:** normalizar `telephone` a E.164; añadir `priceRange`, `openingHoursSpecification` y `hasMap` al `Campground`; agregar `FAQPage` en Normas del Parque; añadir `BreadcrumbList` en `/galeria`, `/contacto`, `/reservar` y las legales. Validar con Rich Results Test.

---

#### M-5. Hero: dos imágenes grandes en `loading="eager"`

- **Archivo:** [src/components/Hero.astro:14](src/components/Hero.astro#L14) (`tierra-roja-drone.webp`, fondo blur a pantalla completa) + [:57](src/components/Hero.astro#L57) y [:69](src/components/Hero.astro#L69) (`tierra-roja-drone.jpg`, tarjeta enmarcada — una para móvil, otra para desktop).
- **Problema:** se descargan hasta 2 imágenes pesadas de forma prioritaria en el primer viewport (la `.jpg` sin optimizar). Compiten por ancho de banda con el CSS y la fuente → LCP más alto.
- **Impacto SEO:** medio (Core Web Vitals / LCP en móvil).
- **Recomendación:** usar una sola imagen fuente servida en `srcset` responsivo vía `astro:assets`; aplicar `fetchpriority="high"` únicamente al elemento LCP real y dejar el resto sin `eager`. Evaluar si el fondo blur puede ser una versión muy comprimida (~20 KB) o un `background` CSS.

---

#### M-6. `alt` genéricos o no descriptivos

- **Archivos:** [src/components/Piscinas.astro:50](src/components/Piscinas.astro#L50) (`alt="Piscina Diversión"` — solo el nombre interno), [src/components/Cabanas.astro:43](src/components/Cabanas.astro#L43) (`alt="Cabaña"`), [src/components/Camping.astro:47](src/components/Camping.astro#L47) (`alt="Espacio para motorhome"` — aceptable pero mejorable), [src/components/Contacto.astro:127](src/components/Contacto.astro#L127) (`alt="Tropical Waterfall"`, en inglés).
- **Impacto SEO:** bajo-medio. Menos tráfico de Google Imágenes y menos contexto para el rastreador; accesibilidad.
- **Recomendación:** `alt` concretos y en español con contexto de lugar: p. ej. *"Piscina con toboganes en el parque acuático de Tierra Roja, Puerto Iguazú"*. Evitar repetir "imagen de" y evitar keyword stuffing.

---

#### M-7. Sitemap sin `lastmod`

- **Archivo:** [astro.config.mjs:19-26](astro.config.mjs#L19-L26) — el `sitemap()` sólo aplica `filter`, sin `serialize`/`lastmod`/`changefreq`.
- **Evidencia:** `dist/client/sitemap-0.xml` contiene solo `<loc>`, sin `<lastmod>`.
- **Impacto SEO:** bajo. Google usa `lastmod` como pista de re-rastreo; su ausencia no rompe nada pero desaprovecha la señal.
- **Recomendación:** añadir `lastmod` (fecha de build o de último commit del archivo) vía la opción `serialize`. `priority`/`changefreq` son opcionales y de bajo impacto.

---

#### M-8. `src` de imágenes relativo (sin `/` inicial) en Piscinas

- **Archivo:** [src/components/Piscinas.astro:8](src/components/Piscinas.astro#L8),[:16](src/components/Piscinas.astro#L16),[:24](src/components/Piscinas.astro#L24) → `imagen: "images/piscina-…webp"`
- **Problema:** funciona solo porque el componente se renderiza en `/`. Si el componente se reutilizara en cualquier ruta anidada, las imágenes romperían (se resolverían contra la ruta actual). El resto del sitio usa rutas absolutas `/images/…`.
- **Impacto SEO:** bajo (hoy no hay bug), pero es deuda frágil.
- **Recomendación:** anteponer `/` → `/images/piscina-…webp`, o migrar a `astro:assets` con `import`.

---

### 🟢 BAJO

---

#### B-1. Favicon incompleto; sin `apple-touch-icon`, `manifest` ni `theme-color`

- **Archivo:** [src/layouts/Layout.astro:75](src/layouts/Layout.astro#L75) — solo `<link rel="icon" type="image/png">`.
- **Recomendación:** añadir `/favicon.ico` en la raíz de `public/`, `apple-touch-icon` (180×180), un `site.webmanifest` mínimo y `<meta name="theme-color" content="#b01c2e">`. Mejora la presentación en pestañas, en resultados móviles y al guardar en pantalla de inicio.

---

#### B-2. Twitter Card sin `twitter:site` / `twitter:creator` / `twitter:image:alt`

- **Archivo:** [src/layouts/Layout.astro:88-91](src/layouts/Layout.astro#L88-L91)
- **Recomendación:** añadir el handle de la marca si existe, y `twitter:image:alt`. Impacto menor (X no es canal principal aquí).

---

#### B-3. Jerarquía de headings: doble `<h2>` en la sección Camping y `<h4>` sin `<h3>` en el Footer

- **Archivos:** [src/components/Camping.astro:22](src/components/Camping.astro#L22) y [:55](src/components/Camping.astro#L55) (dos `<h2>` hermanos: "Camping en la Selva" y "Espacio Motorhome"); [src/components/Footer.astro:72](src/components/Footer.astro#L72),[:92](src/components/Footer.astro#L92),[:112](src/components/Footer.astro#L112) (`<h4>` sin `<h3>` previo en su rama).
- **Problema:** no es un error grave (varios `<h2>` son válidos), pero "Espacio Motorhome" es una subsección de la tarjeta secundaria y encajaría mejor como `<h3>`. El salto a `<h4>` en el footer es un salto de nivel.
- **Recomendación:** bajar "Espacio Motorhome" a `<h3>`; cambiar los `<h4>` del footer a `<h2>` o `<h3>` según el nivel real. Prioridad baja.

---

#### B-4. `/reservar` es indexable y está en el sitemap pero tiene contenido delgado

- **Archivos:** [src/pages/reservar.astro:2](src/pages/reservar.astro#L2) (`prerender = false`, SSR), widget React `client:load` ([:39](src/pages/reservar.astro#L39)).
- **Problema:** la página es esencialmente un `<header>` + un widget interactivo (bundle `BookingWidget` ~23 KB) sin texto sustancial server-rendered. Poco valor para indexar como está.
- **Recomendación:** añadir un bloque de contenido estático server-render (tipos de unidad, cómo funciona la reserva, política de pago resumida enlazando a T&C) para que la URL tenga valor semántico; o excluirla del sitemap si se prefiere no rankearla.

---

#### B-5. Secciones clave del negocio no tienen URL propia

- **Archivos:** [src/components/Navbar.astro](src/components/Navbar.astro) y [src/components/Footer.astro](src/components/Footer.astro) enlazan a `/#piscinas`, `/#camping`, `/#cabanas` (anclas de la home).
- **Problema:** "piscinas / parque acuático", "camping" y "cabañas" son intenciones de búsqueda distintas y comparten una sola URL (`/`). Se compite consigo mismo por keyword.
- **Recomendación (media-baja):** valorar páginas dedicadas `/parque-acuatico`, `/camping`, `/cabana` con contenido propio (fotos reales, servicios, precios, FAQ) y dejar la home como resumen que enlaza a ellas. Mejora cobertura de long-tail y profundidad de contenido.

---

#### B-6. Sin verificación de Google Search Console ni herramienta de medición

- **Evidencia:** `grep` de `google-site-verification`, `gtag`, `gtm`, `clarity`, etc. → sin resultados en `src/` ni `public/`.
- **Nota:** la política de privacidad ([src/pages/politica-de-privacidad.astro:? sección Cookies](src/pages/politica-de-privacidad.astro)) declara explícitamente no usar analítica; es una decisión válida. Pero la **verificación de Search Console** (por registro DNS TXT o meta tag) no implica cookies y es imprescindible para monitorear indexación, enviar el sitemap y detectar problemas.
- **Recomendación:** verificar el dominio en Google Search Console (preferible vía DNS) y enviar `sitemap-index.xml`. Opcionalmente, una analítica sin cookies (p. ej. server-side) si se quiere medir tráfico sin tocar la política.

---

#### B-7. Archivos residuales de sincronización

- **Archivos:** `contacto.html` en la raíz del repo (legacy, no se sirve — Astro solo publica `public/` y `src/pages/`), `src/lib/reservas 2.ts` (duplicado de `src/lib/reservas.ts` por conflicto de sync). En `dist/` también aparecían `index 2.html`, `robots 2.txt`, etc.
- **Impacto SEO:** nulo directo, pero `reservas 2.ts` puede causar imports ambiguos y el `.html` suelto confunde.
- **Recomendación:** borrar `contacto.html` y `src/lib/reservas 2.ts`. Añadir `* 2.*` y `*.DS_Store` a `.gitignore`. Confirmar que no haya `.DS_Store` trackeados.

---

#### B-8. `vercel.json` sin cabeceras de caché para assets estáticos de `/public`

- **Archivo:** [vercel.json](vercel.json) — solo define `crons`. En `.vercel/output/config.json` únicamente `/_astro/*` recibe `Cache-Control: max-age=31536000, immutable`.
- **Problema:** las imágenes de `public/images/` se sirven sin política de caché de larga duración explícita (dependen del default de Vercel).
- **Recomendación:** añadir un bloque `headers` en `vercel.json` para `/images/(.*)` con `Cache-Control: public, max-age=604800, stale-while-revalidate=86400` (o `immutable` si se versionan los nombres de archivo). **La compresión (gzip/brotli) y HTTP/2 los aplica Vercel automáticamente — verificación de cabeceras reales fuera del alcance.**

---

## 3. Tabla resumen

| # | Categoría | Problema | Severidad | Archivo(s) |
|---|-----------|----------|-----------|-----------|
| C-1 | On-page / Contenido | Texto "Lorem ipsum" e inglés en página indexable | 🔴 Crítico | `src/components/Contacto.astro:13-22,127,139` |
| C-2 | Indexabilidad | Dominio canónico inconsistente / posible mismatch con producción | 🔴 Crítico | `astro.config.mjs:12,32-37`; `src/layouts/Layout.astro:20` |
| C-3 | SEO local / Datos estructurados | NAP inconsistente (dos direcciones distintas) | 🔴 Crítico | `src/components/Contacto.astro:91` vs `src/layouts/Layout.astro:42-43`, `src/components/Footer.astro:170` |
| A-1 | Metadatos sociales | `og:image` en WebP → sin preview en Facebook/WhatsApp | 🟠 Alto | `src/layouts/Layout.astro:15,85,91` |
| A-2 | Contenido / Rendimiento | Imágenes de stock de terceros como fotos propias; una URL efímera | 🟠 Alto | `src/components/Galeria.astro:25-57,116`; `src/components/Contacto.astro:130` |
| A-3 | Core Web Vitals | Ninguna `<img>` con `width`/`height` (CLS) | 🟠 Alto | Todos los componentes con imágenes (ver A-3) |
| A-4 | Conversión / Accesibilidad | Formulario de contacto sin `action`, `name`, labels; "Mensa" | 🟠 Alto | `src/components/Contacto.astro:30-77` |
| A-5 | On-page | H1 no descriptivos / sin keyword en Home y Contacto | 🟠 Alto | `src/components/Hero.astro:28-36`; `src/components/Contacto.astro:6-11` |
| M-1 | Configuración técnica | Sin página 404 propia | 🟡 Medio | (falta `src/pages/404.astro`) |
| M-2 | HTML semántico | Falta elemento `<main>` | 🟡 Medio | `src/layouts/Layout.astro:112-116` |
| M-3 | Rendimiento / LCP | Fuentes redundantes, externas y render-blocking; icon-font completa | 🟡 Medio | `src/layouts/Layout.astro:98-106`; `src/styles/global.css:39-52` |
| M-4 | Datos estructurados | Solo `Campground`; falta FAQ/Breadcrumb/priceRange; `telephone` no E.164 | 🟡 Medio | `src/layouts/Layout.astro:25-63` |
| M-5 | Core Web Vitals | Hero con 2 imágenes grandes en `eager` | 🟡 Medio | `src/components/Hero.astro:14,57,69` |
| M-6 | On-page / Imágenes | `alt` genéricos o en inglés | 🟡 Medio | `src/components/Piscinas.astro:50`; `src/components/Cabanas.astro:43`; `src/components/Contacto.astro:127` |
| M-7 | Rastreo | Sitemap sin `lastmod` | 🟡 Medio | `astro.config.mjs:19-26` |
| M-8 | Estructura de URLs / Assets | `src` de imágenes relativo (sin `/`) | 🟡 Medio | `src/components/Piscinas.astro:8,16,24` |
| B-1 | Configuración técnica | Favicon incompleto; sin apple-touch-icon/manifest/theme-color | 🟢 Bajo | `src/layouts/Layout.astro:75` |
| B-2 | Metadatos sociales | Twitter Card sin `site`/`creator`/`image:alt` | 🟢 Bajo | `src/layouts/Layout.astro:88-91` |
| B-3 | HTML semántico | Doble `<h2>` en Camping; `<h4>` sin `<h3>` en Footer | 🟢 Bajo | `src/components/Camping.astro:22,55`; `src/components/Footer.astro:72,92,112` |
| B-4 | Contenido | `/reservar` indexable pero con contenido delgado (SSR + widget) | 🟢 Bajo | `src/pages/reservar.astro:2,39` |
| B-5 | Arquitectura de contenido | Piscinas/Camping/Cabañas sin URL propia (solo anclas de la home) | 🟢 Bajo | `src/components/Navbar.astro`; `src/components/Footer.astro` |
| B-6 | Medición | Sin verificación de Search Console ni analítica | 🟢 Bajo | (no presente en `src/`, `public/`) |
| B-7 | Housekeeping | `contacto.html` y `src/lib/reservas 2.ts` residuales | 🟢 Bajo | raíz del repo; `src/lib/` |
| B-8 | Rendimiento | `vercel.json` sin `Cache-Control` para `/images` | 🟢 Bajo | `vercel.json`; `.vercel/output/config.json` |

---

## 4. Lo que ya está bien (no requiere acción)

- `output: 'server'` con `prerender = true` en todas las páginas públicas → HTML estático, rápido e indexable.
- `<title>` y `meta description` **únicos y descriptivos** en las 7 páginas públicas (verificado en `dist/`).
- `<link rel="canonical">` self-referencing generado desde una única fuente (`Astro.site`).
- Open Graph y Twitter Card completos (salvo el formato de imagen, A-1).
- JSON-LD `Campground` válido y bien poblado (dirección, geo, `sameAs`, `amenityFeature`).
- `robots.txt` coherente, con `Disallow` de `/panel/` y `/api/` y referencia al sitemap.
- Sitemap generado automáticamente, con exclusión correcta de `/panel` y `/api/` ([astro.config.mjs:24](astro.config.mjs#L24)).
- `/panel/**` protegido por middleware con redirect a login → no indexable.
- `<html lang="es">` correcto; sitio monolingüe → **hreflang no aplica**.
- `<meta name="viewport">` correcto, sin `user-scalable=no` ni `maximum-scale` (bien para accesibilidad).
- Sin contenido mixto: el iframe de Google Maps y las imágenes externas usan HTTPS.
- Imágenes below-the-fold con `loading="lazy"` de forma consistente.
- Anchor text de enlaces internos descriptivo (no hay "click aquí"); profundidad de rastreo ≤ 1 clic para todas las páginas.
- Navegación móvil funcional con `aria-expanded` / `aria-controls` / `aria-label` en el toggle.
