# Localización a español neutro (panhispánico)

Revisión y reescritura de los textos visibles del sitio para eliminar rasgos
rioplatenses/porteños (voseo, vocabulario regional, registro) y dejarlos en
español neutro, sin cambiar el significado, el tono de marca ni las keywords SEO.

## 1. Resumen

| Métrica | Valor |
|---|---|
| Archivos modificados | 19 |
| Fragmentos de texto neutralizados | ~50 |
| Testimonios / citas de personas reales modificados | 0 (no hay en el sitio) |
| Build (`npm run build`) | OK tras los cambios |

Tipo de cambio predominante: **voseo → tuteo** (imperativos `escribinos/probá/elegí/
reservá`, presentes `tenés/podés/aceptás/reservás`). Menor: **vocabulario** (`en criollo`,
`acá`, `reposeras`, `sin vueltas`) y **registro** (consistencia del imperativo).

No se tocaron: nombres de marca/producto (`Tierra Roja`, `Motorhome`, `Quinchos`,
`Cabaña`), datos NAP (`src/lib/negocio.ts`), slugs/URLs, claves de i18n, códigos de
locale (`es-AR` / `es_AR`), comentarios de código ni lógica.

---

## 2. Detalle por archivo

### Componentes públicos

#### `src/components/Contacto.astro`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| …escribinos por WhatsApp o completá el formulario y te respondemos… | …escríbenos por WhatsApp o completa el formulario y te respondemos… | voseo |
| Envianos tu mensaje | Envíanos tu mensaje | voseo |
| Encontranos en el mapa | Encuéntranos en el mapa | voseo |
| No pudimos enviar tu mensaje. Probá por WhatsApp. (×2, script) | No pudimos enviar tu mensaje. Prueba por WhatsApp. | voseo |

#### `src/components/Galeria.astro`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| Reservá tu lugar en Tierra Roja y sé parte de estos momentos. | Reserva tu lugar en Tierra Roja y sé parte de estos momentos. | voseo |

#### `src/components/Piscinas.astro`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| …cortina de agua bajo la pérgola, reposeras y juegos. | …cortina de agua bajo la pérgola, sillas reclinables y juegos. | vocabulario (regionalismo Cono Sur → término neutro) |

#### `src/components/BookingWidget.tsx`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| No pudimos consultar la disponibilidad. Probá de nuevo. | No pudimos consultar la disponibilidad. Prueba de nuevo. | voseo |
| Elegí el día / Elegí tus fechas | Elige el día / Elige tus fechas | voseo |
| Verificá nombre, apellido y DNI contra el documento físico… | Verifica nombre, apellido y DNI contra el documento físico… | voseo (pantalla de Staff) |

### Páginas públicas

#### `src/pages/reservar.astro`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| `description`: Reservá tu lugar en Tierra Roja… | Reserva tu lugar en Tierra Roja… | voseo (meta description) |
| `<h1>` Reservá tu lugar | Reserva tu lugar | voseo |
| Elegí fechas y confirmá al instante. Sin registro, sin vueltas. | Elige fechas y confirma al instante. Sin registro, sin complicaciones. | voseo + vocabulario/registro (`sin vueltas` coloquial) |
| Qué podés reservar | Qué puedes reservar | voseo |
| Elegí el tipo de unidad… y confirmá al instante… Podés ver el detalle… | Elige el tipo de unidad… y confirma al instante… Puedes ver el detalle… | voseo |

#### `src/pages/galeria.astro`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| `description`: Recorré nuestra galería de fotos… | Recorre nuestra galería de fotos… | voseo (meta description) |

#### `src/pages/contacto.astro`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| `description`: Contactate con Tierra Roja… | Contáctate con Tierra Roja… | voseo (meta description) |

#### `src/pages/normas-del-parque.astro`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| (FAQ) Al ingresar debés acreditar tu identidad… | Al ingresar debes acreditar tu identidad… | voseo (también en el JSON-LD `FAQPage`) |
| (FAQ) Usá los cestos de residuos… y ayudanos a mantener… | Usa los cestos de residuos… y ayúdanos a mantener… | voseo |
| ¿Tenés alguna consulta sobre el reglamento? Escribinos a… | ¿Tienes alguna consulta sobre el reglamento? Escríbenos a… | voseo |
| …utilizá los cestos de residuos… y ayudanos a mantener… | …utiliza los cestos de residuos… y ayúdanos a mantener… | voseo |

#### `src/pages/terminos-y-condiciones.astro`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| …te pedimos que leas estas condiciones. Acá explicamos… | …te pedimos que leas estas condiciones. Aquí explicamos… | vocabulario (`acá` → `aquí`) |
| ¿Tenés dudas sobre estos términos? Escribinos a… | ¿Tienes dudas sobre estos términos? Escríbenos a… | voseo |
| …al navegar el sitio o completar una reserva, aceptás estas condiciones… | …aceptas estas condiciones… | voseo |
| Elegís las fechas y la unidad, completás tus datos de contacto… | Eliges las fechas y la unidad, completas tus datos de contacto… | voseo |
| …la anticipación con la que reservás, y se acorta… | …la anticipación con la que reservas, y se acorta… | voseo |
| Si ya efectuaste el pago y necesitás modificar o cancelar tu reserva, escribinos… | Si ya efectuaste el pago y necesitas modificar o cancelar tu reserva, escríbenos… | voseo |
| Si tenés preguntas sobre estos Términos y Condiciones… escribinos: | Si tienes preguntas sobre estos Términos y Condiciones… escríbenos: | voseo |

#### `src/pages/politica-de-privacidad.astro`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| Acá te contamos, en criollo, qué información recopilamos… y cómo podés ejercer tus derechos. | Aquí te contamos, en palabras simples, qué información recopilamos… y cómo puedes ejercer tus derechos. | vocabulario (`acá`, `en criollo` = modismo rioplatense de "en lenguaje llano") + voseo |
| ¿Tenés dudas sobre tus datos? Escribinos a… | ¿Tienes dudas sobre tus datos? Escríbenos a… | voseo |
| …aplica a los datos que nos brindás al reservar… | …aplica a los datos que nos brindas al reservar… | voseo |
| …los datos que nos proporcionás de forma directa y voluntaria… | …los datos que nos proporcionas de forma directa y voluntaria… | voseo |
| Podés solicitar la eliminación de tus datos en cualquier momento… | Puedes solicitar la eliminación de tus datos en cualquier momento… | voseo |
| …tenés derecho a acceder, rectificar… Para ejercer cualquiera de estos derechos, escribinos a… | …tienes derecho a acceder, rectificar… Para ejercer cualquiera de estos derechos, escríbenos a… | voseo |
| Si tenés preguntas sobre esta Política de Privacidad… escribinos: | Si tienes preguntas sobre esta Política de Privacidad… escríbenos: | voseo |

#### `src/pages/404.astro`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| `description`: La página que buscás no existe. Volvé al inicio… | La página que buscas no existe. Vuelve al inicio… | voseo (meta description) |
| …o que la página se haya movido. Probá con alguna de estas secciones: | …o que la página se haya movido. Prueba con alguna de estas secciones: | voseo |

### Textos de sistema (emails y mensajes de API visibles en la UI)

#### `src/lib/email.ts` (email de confirmación de reserva)
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| Tenés hasta el {fecha} para transferir la seña. | Tienes hasta el {fecha} para transferir la seña. | voseo |
| Si necesitás modificar o cancelar tu reserva, escribinos por WhatsApp al [COMPLETAR]. | Si necesitas modificar o cancelar tu reserva, escríbenos por WhatsApp al [COMPLETAR]. | voseo |

#### `src/pages/api/contacto.ts` (mensajes de error del formulario)
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| Completá tu nombre, un email válido y el mensaje. | Completa tu nombre, un email válido y el mensaje. | voseo |
| No pudimos enviar tu mensaje. Escribinos por WhatsApp. | No pudimos enviar tu mensaje. Escríbenos por WhatsApp. | voseo |

### Panel interno (Staff / Administración)

#### `src/pages/panel/login.astro`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| Tu usuario no tiene un perfil asignado. Contactá al administrador. | Tu usuario no tiene un perfil asignado. Contacta al administrador. | voseo |

#### `src/pages/panel/pendientes-pago.astro`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| …Avisá manualmente por WhatsApp con los datos de contacto. | …Avisa manualmente por WhatsApp con los datos de contacto. | voseo |

#### `src/pages/panel/reservas/[id].astro`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| Registrá al menos un pago para poder hacer check-in. | Registra al menos un pago para poder hacer check-in. | voseo |

#### `src/pages/panel/admin/calendario.astro`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| `title`: Clic o arrastrá para crear una reserva en estas fechas | `title`: Haz clic o arrastra para crear una reserva en estas fechas | voseo + registro |

#### `src/pages/panel/admin/configuracion.astro`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| ¿Confirmás guardar este cambio? | ¿Confirmas guardar este cambio? | voseo |

#### `src/pages/api/panel/reservas/[id]/pago.ts`
| Texto original | Texto neutralizado | Motivo |
|---|---|---|
| Indicá el método de pago | Indica el método de pago | voseo |

---

## 3. Casos dudosos (decisión manual)

1. **`"seña"`** (en `src/lib/email.ts`, `src/pages/reservar.astro`, `terminos-y-condiciones.astro`).
   Es el término de "anticipo/pago parcial" habitual en Argentina y buena parte de
   Hispanoamérica (Chile, Perú, Uruguay, Paraguay), pero en España se dice "señal".
   **No lo cambié** porque es ampliamente comprensible en la región y forma parte del
   flujo de negocio. Si el público objetivo incluye España, considerar "anticipo".

2. **`"quincho"` / `"Quinchos"`** (nombre del tipo de unidad reservable, en todo el
   sitio y en la base de datos). Regionalismo del Cono Sur para "cobertizo con
   parrilla". **No lo cambié** por la regla de no tocar nombres de producto. Si se
   quiere neutralizar, habría que renombrar la unidad en todo el sistema (UI + datos).

3. **`"carpa"`** (`reservar.astro`, `BookingWidget.tsx`, alt de imágenes). Es el término
   estándar en Latinoamérica para "tienda de campaña" (término de España). **Lo mantuve**
   porque "tienda de campaña" sonaría marcadamente ibérico para el público principal.

4. **`"reposeras"` → `"sillas reclinables"`** (`Piscinas.astro`). Apliqué el cambio
   (regionalismo Cono Sur), pero "sillas reclinables" es una elección de traducción:
   confirmar si preferís otra ("camastros", "tumbonas", "reposeras" tal cual).

5. **Eslogan de marca** en `src/components/Cabanas.astro`:
   *"El confort de un hotel, la esencia de la selva."* Está entre comillas como lema de
   marca. **No lo modifiqué**: no tiene rasgos rioplatenses y es texto de marca.

6. **Códigos de locale** `es-AR` (`site.webmanifest`, `politica-de-privacidad` menciona
   Ley argentina) y `es_AR` (`og:locale` en `Layout.astro`). **No los toqué**: son
   configuración/metadatos, no "acento" en el texto, y reflejan que el negocio opera en
   Argentina (marco legal incluido).

7. **`"complete los datos manualmente"`** en `src/components/BookingWidget.tsx` (mensaje
   de error de escaneo de DNI, pantalla de Staff). No es rioplatense, pero usa "usted"
   (`complete`) mientras el resto del panel tutea. **Lo dejé** por estar fuera del
   alcance (neutralizar acento, no unificar tuteo/usteo), pero conviene cambiarlo a
   "completa los datos manualmente" por consistencia.
