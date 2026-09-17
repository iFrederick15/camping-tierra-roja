---
name: Tierra Roja - Camping y Parque Acuático
description: Web pública y panel de reservas de un camping con parque acuático en Puerto Iguazú, Misiones.
colors:
  primario: "#b01c2e"
  primario-claro: "#d4343f"
  primario-oscuro: "#8a1524"
  acento: "#ef493d"
  acento-texto: "#cc3327"
  negro: "#1a1a1a"
  fondo: "#fdf8f6"
  fondo-alt: "#f5efec"
  fondo-oscuro: "#2b1810"
  superficie: "#ffffff"
  superficie-elevada: "#f9f3f0"
  texto: "#2d2321"
  texto-suave: "#6b5b55"
  borde: "#e3d5ce"
  confirmado: "#137a38"
  advertencia: "#8f6519"
  estrella: "#f5b301"
  whatsapp: "#0d6d61"
  whatsapp-hover: "#0b6055"
typography:
  display:
    fontFamily: "Ubuntu, Barlow, sans-serif"
    fontSize: "clamp(2.1rem, 6vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Ubuntu, Barlow, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Ubuntu, Barlow, sans-serif"
    fontSize: "clamp(1.5rem, 2.5vw, 1.875rem)"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "clamp(1rem, 1.5vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Ubuntu, Barlow, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.14em"
  button:
    fontFamily: "Ubuntu, Barlow, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    letterSpacing: "0.025em"
rounded:
  campo: "8px"
  contenedor: "12px"
  atajo: "16px"
  card: "24px"
  footer: "48px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "24px"
  lg: "32px"
  xl: "48px"
  seccion: "80px"
  seccion-lg: "112px"
components:
  button-primary:
    backgroundColor: "{colors.primario}"
    textColor: "{colors.superficie}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "12px 28px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.primario-oscuro}"
  button-claro:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.primario}"
    rounded: "{rounded.pill}"
    padding: "12px 28px"
    height: "48px"
  button-claro-hover:
    backgroundColor: "{colors.fondo-alt}"
  button-contorno:
    backgroundColor: "transparent"
    textColor: "{colors.primario}"
    rounded: "{rounded.pill}"
    padding: "12px 28px"
    height: "48px"
  button-contorno-hover:
    backgroundColor: "{colors.primario}"
    textColor: "{colors.superficie}"
  button-whatsapp:
    backgroundColor: "{colors.whatsapp}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: "48px"
  button-whatsapp-hover:
    backgroundColor: "{colors.whatsapp-hover}"
  card-superficie:
    backgroundColor: "{colors.superficie-elevada}"
    rounded: "{rounded.card}"
    padding: "32px"
  input-campo:
    backgroundColor: "{colors.fondo-alt}"
    textColor: "{colors.texto}"
    rounded: "{rounded.campo}"
    padding: "16px"
  input-campo-focus:
    backgroundColor: "{colors.superficie}"
  chip-estado-pagado:
    backgroundColor: "#137a381a"
    textColor: "{colors.confirmado}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  chip-estado-parcial:
    backgroundColor: "#8f65191a"
    textColor: "{colors.advertencia}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  chip-estado-no-pagado:
    backgroundColor: "#b01c2e1a"
    textColor: "{colors.primario}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: Tierra Roja - Camping y Parque Acuático

## Overview

**Creative North Star: "La tierra colorada"**

El rojo del suelo de Misiones es lo que une todo. Un solo rojo de marca, plano y sin degradé, marca el camino: reservar, el estado activo, el dato que importa. Todo lo demás se apoya en un papel cálido (fondos rosados-crema, bordes arena) y en fotos reales del predio: la selva, las piscinas, las parcelas. La foto aporta el color de la naturaleza y la interfaz no le compite.

El sistema es práctico y sobrio. Los botones cambian de color en hover y no se levantan ni brillan. Los títulos van en Ubuntu, la tipografía del manual de marca, en negrita y firmes. El cuerpo va en Barlow, con un tono DIN cercano a la cartelería. La densidad es media y generosa en mobile: tocar con el pulgar es el caso principal. La profundidad se arma con tres sombras en dos capas neutras con un rol fijo, nunca con halos, vidrio ni teñidos rojos.

Rechazos confirmados: el look de plantilla hecha con IA. Eso incluye degradés rojo→naranja en botones, texto con degradé, glassmorphism, halos difusos en las esquinas, fotos desenfocadas para ganar contraste, sombras teñidas de rojo, botones y tarjetas que se levantan o escalan en hover, y píldoras rosadas con ícono de "verificado" como sello.

**Key Characteristics:**
- Un rojo de marca plano como única voz de acción.
- Neutros cálidos (papel y tierra) en vez de grises fríos.
- Fotos reales del predio, nítidas, con overlays oscuros para el texto encima.
- Formas de píldora para acciones y tarjetas de esquina amplia (24px).
- Tres sombras estructurales, en dos capas neutras.
- Movimiento solo funcional: aparecer, desaparecer, indicar estado.

## Colors

Un rojo de marca saturado sobre una base de papel cálido, con verde y ámbar reservados a estados y el verde oscuro de WhatsApp como único color externo.

### Primary
- **Rojo Tierra Roja** (primario): el color de la acción. Fondo del botón de reserva, anillo de foco global, subrayado del enlace activo en la navegación, kicker de sección sobre fondo claro, íconos de acento en listas sobre claro, y el fondo de bloques de cierre (franja del footer, sección Cabaña, banda final de Galería).
- **Rojo Tierra Roja profundo** (primario-oscuro): solo es el hover y el estado presionado de los botones rojos.
- **Rojo Tierra Roja claro** (primario-claro): solo el borde en hover de las filas del panel. Nunca es el hover de un botón rojo, y no sirve para texto chico sobre blanco.

### Secondary
- **Brasa** (acento): el nombre "Tierra Roja" dentro del H1 del hero, sobre foto oscura (4,8:1), e íconos de lista sobre fotos. Sobre blanco da 3,7:1: solo sirve para texto grande.
- **Brasa legible** (acento-texto): la variante de Brasa para texto chico sobre claro.

### Tertiary
- **Verde WhatsApp profundo** (whatsapp / whatsapp-hover): solo para el botón y los enlaces de WhatsApp. Es un tono del sistema de WhatsApp oscurecido para llegar a 6,2:1 con blanco. No usar el `#25D366` oficial.
- **Estado confirmado** (confirmado) y **Estado advertencia** (advertencia): estados de pago del panel y mensajes de formulario. Oscurecidos para llegar a 4,5:1.
- **Estrella de reseña** (estrella): solo la estrella rellena de la valoración de Google.

### Neutral
- **Papel cálido** (fondo): fondo de página en toda la web y el panel.
- **Papel cálido sombreado** (fondo-alt): campos de formulario en reposo, hover de ítems de menú, fondos de íconos circulares y del buscador del panel.
- **Papel elevado** (superficie-elevada): tarjetas de contenido sobre el fondo (Motorhome, cierre CTA).
- **Blanco** (superficie): navbar, footer, formularios, menús desplegables y el campo con foco.
- **Tierra húmeda** (fondo-oscuro): la tarjeta de la Cabaña sobre el rojo. Es la única superficie oscura del sistema.
- **Tinta cálida** (texto): el cuerpo de texto.
- **Tinta suave** (texto-suave): bajadas, metadatos, enlaces de navegación en reposo y labels.
- **Casi negro** (negro): los H2 y H3 sobre claro, y la base de los overlays sobre fotos.
- **Arena** (borde): bordes de tarjetas, campos, divisores y la navbar al hacer scroll.

### Named Rules
**La regla del rojo único.** El rojo es la acción. Un elemento rojo sobre claro se puede tocar o marca dónde está el usuario. No se usa como decoración de fondo detrás de contenido neutro, salvo los bloques de cierre ya existentes.

**La regla del contraste medido.** Cada color que lleva texto tiene su variante que pasa WCAG AA (acento-texto, whatsapp, confirmado, advertencia). Un color nuevo con texto encima llega con su ratio calculado.

## Typography

**Display Font:** Ubuntu (con Barlow, sans-serif), pesos 400, 500 y 700.
**Body Font:** Barlow (con system-ui, sans-serif), pesos 400, 500, 600 y 700.

**Character:** Ubuntu es la fuente de marca según el manual: redondeada, humana, firme en negrita. Barlow reemplaza a Bahnschrift (propietaria, sin licencia web) con el mismo aire DIN de cartelería: legible, algo técnico, nada decorativo.

### Hierarchy
- **Display**: solo el H1 del hero. Blanco sobre foto, con la segunda línea en Brasa. Crece de 2.1rem en mobile a 4.5rem en xl.
- **Headline**: los H2 de sección, a través de `EncabezadoSeccion`. Centrados por defecto, con `text-balance` y ancho máximo de 42rem junto a la bajada.
- **Title**: H2 secundarios dentro de secciones (Motorhome) y H3 de tarjetas.
- **Body**: bajadas de sección en 1.125rem con interlineado relajado, y texto de tarjeta en 1rem. La bajada se limita a unos 36–42rem de ancho y usa `text-pretty`.
- **Label**: kicker de sección, en mayúsculas y bold con tracking de 0.14em, en Rojo Tierra Roja sobre claro o blanco al 85% sobre oscuro. También los rótulos de grupo del menú mobile.

### Named Rules
**La regla del kicker.** Una sección lleva como máximo un kicker, siempre en Ubuntu bold, mayúsculas y tracking 0.14em. No se inventan otros estilos de sobretítulo.

**La regla sin itálica.** La itálica no es parte del sistema. La cita y el nombre de la Cabaña en itálica son una excepción heredada, marcada como pendiente de revisar, y no un patrón a copiar.

## Layout

Contenedor principal de 1280px de ancho máximo, con 24px de margen lateral (32px desde lg). Las secciones de la landing tienen 80px de padding vertical y 112px desde lg. Las grillas de contenido son de 12 columnas desde lg, en composiciones asimétricas (7/5 para Camping y Motorhome, 3/2 para foto y texto de la Cabaña), con gaps de 24 a 32px. En mobile todo apila en una columna y los CTA pasan a ancho completo.

Puntos de quiebre de Tailwind por defecto. La navegación completa aparece recién en xl (1280px); antes usa menú desplegable. Debajo de lg (1024px) aparece la barra de reserva fija y el `body` reserva `4rem + safe-area` al final para que no tape el footer. Los anclajes de la landing tienen `scroll-padding-top` de 5rem por la navbar sticky.

El panel usa una topbar de 64px con logo, buscador (solo lg) y accesos, y listas de filas-tarjeta a ancho completo.

## Elevation & Depth

Capas suaves estructurales. Las tres sombras son de dos capas: una línea de contacto corta y nítida más una difusa con desplazamiento negativo, siempre en un marrón tierra muy transparente y nunca teñidas de rojo. Cada una tiene un rol fijo, y el borde Arena complementa en superficies que no flotan.

### Shadow Vocabulary
- **Suave** (`box-shadow: 0 1px 1px rgba(43,24,16,0.05), 0 3px 8px -4px rgba(43,24,16,0.14)`): tarjetas en reposo (Motorhome, atajos de alojamiento, atajo de reserva en Contacto) y el filtro activo de Galería.
- **Elevada** (`box-shadow: 0 2px 3px rgba(43,24,16,0.06), 0 14px 26px -16px rgba(43,24,16,0.28)`): contenedor del formulario, menús desplegables y hover de atajos.
- **Hero** (`box-shadow: 0 3px 6px rgba(43,24,16,0.07), 0 28px 48px -28px rgba(43,24,16,0.4)`): foto protagonista del hero y tarjeta oscura de la Cabaña sobre el rojo.

### Named Rules
**La regla de las tres sombras.** No hay una cuarta sombra. Si algo necesita separarse más que Elevada y no es la foto principal ni una tarjeta sobre color, usa borde.

**La regla sin halo.** Ni `blur` decorativo, ni `backdrop-blur`, ni sombras de color. La profundidad es luz sobre papel, no brillo.

## Shapes

Esquinas amplias y amables. Las tarjetas y bloques grandes van a 24px, las acciones son píldoras completas, los atajos de alojamiento y desplegables van a 16px, los ítems del menú mobile a 12px, y los campos y los cuadrados de íconos a 8px. Formularios, bloques de datos, fotos y mapas son tarjetas: van a 24px como el resto. El footer abre con una curva superior de 48px, que es su única forma distintiva. Los íconos de acción sueltos (menú, redes, buscador del panel) son círculos. Las fotos siempre se recortan por su contenedor redondeado (`overflow-hidden`) con `object-cover`.

## Components

### Buttons
Prácticos y sobrios: firmes en negrita y del tamaño del pulgar, sin gesto.
- **Shape:** píldora completa. Altura mínima de 44px (sm), 48px (md) o 56px (lg).
- **Primario:** Rojo Tierra Roja con texto blanco en Ubuntu bold y tracking leve. Puede llevar una flecha de Material Symbols a la derecha.
- **Hover / Focus:** hover cambia a Rojo Tierra Roja profundo en 150ms. El foco es un anillo de 4px del rojo al 40% con 2px de separación. Solo este botón de reserva tiene press `scale(0.97)`.
- **Claro:** blanco con texto rojo, para usar sobre rojo o foto. **Contorno:** borde de 2px rojo que se rellena en hover. **Contorno claro:** borde blanco al 70% sobre oscuro.
- **WhatsApp:** Verde WhatsApp profundo con el logo en SVG, en variantes relleno, contorno y enlace subrayado. Sin press ni flecha.

### Chips (estado de pago, panel)
- **Style:** píldora con fondo del color de estado al 10%, texto del color de estado y borde al 30%, en Ubuntu bold de 12px.
- **State:** Pagado (confirmado), Parcial (advertencia), No pagado (primario). En el calendario admin, las barras de reserva usan azul, verde, ámbar y marrón.

### Cards / Containers
- **Corner Style:** 24px.
- **Background:** Papel elevado sobre fondo, blanco para formularios, o foto a sangre con overlay `negro/95 → negro/10` de abajo hacia arriba y texto blanco (tarjeta de Camping).
- **Shadow Strategy:** Suave en reposo y Elevada para formularios y hover (ver Elevation & Depth).
- **Border:** Arena de 1px en bloques sobre fondo claro. Las filas del panel llevan borde de 2px que pasa a Rojo claro en hover.
- **Internal Padding:** de 24px en mobile a 32–48px en desktop.

### Inputs / Fields
- **Style:** fondo Papel cálido sombreado, borde Arena de 1px, esquinas de 8px y 16px de padding. El label va arriba en Barlow semibold de 14px con Tinta suave.
- **Focus:** el fondo pasa a blanco, el borde a rojo y aparece un anillo de 4px del rojo al 20%.
- **Error / Disabled:** el mensaje de estado va debajo con `aria-live`: rojo si hay error, confirmado si salió bien. El botón deshabilitado queda al 60% de opacidad.

### Navigation
- **Style:** navbar blanca y sticky con logo de 48 a 64px de alto. Los enlaces van en Ubuntu medium de 14px con Tinta suave y pasan a rojo en hover, con un subrayado de 2px que crece desde la izquierda. El enlace de la página actual queda rojo y subrayado. Al hacer scroll aparecen `shadow-sm` y el borde Arena.
- **Mobile:** botón circular de 44px que rota su ícono. El panel baja con opacidad y 8px de desplazamiento en 200ms, trae ítems de 48px de alto, selector de idioma en lista y el CTA de reserva a ancho completo al final.

### Atajos de alojamiento (signature)
Grilla de tres tarjetas cuadradas (Camping, Motorhome, Cabaña), cada una con ícono grande, nombre en Ubuntu bold y detalle corto. Esquinas de 16px. En tono oscuro van sobre blanco con borde y sombra Suave, y en hover el borde toma rojo y la sombra pasa a Elevada. Cada una lleva directo al reservador con la unidad elegida.

### Barra de reserva mobile (signature)
Barra fija abajo, debajo de lg, con el botón de reserva rojo de 48px a ancho completo. Respeta el safe-area.

## Do's and Don'ts

### Do:
- **Do** usar Rojo Tierra Roja plano (primario) para toda acción de reserva, y Rojo Tierra Roja profundo (primario-oscuro) solo como hover.
- **Do** tomar colores, sombras, radios y fuentes de los tokens `@theme` en `src/styles/global.css` (`bg-primario`, `shadow-suave`, `rounded-card`, `font-titulo`), no de valores sueltos.
- **Do** usar fotos reales del predio, nítidas, y dar contraste con overlays de `negro` en degradé.
- **Do** mantener el mínimo táctil de 44px en todo lo que se toca.
- **Do** usar `EncabezadoSeccion`, `BotonReserva` y `BotonWhatsApp` en vez de repetir sus clases.
- **Do** animar solo entradas y salidas funcionales (opacidad más un desplazamiento o escala corta, con `ease-out` reforzado de 150 a 200ms) y la rotación de íconos que indican estado.
- **Do** agregar cada ícono nuevo de Material Symbols a `src/lib/iconos.ts`.

### Don't:
- **Don't** usar degradés en botones (`from-primario to-acento`) ni texto con degradé (`bg-clip-text`).
- **Don't** usar `hover:-translate-y-*`, `hover:scale-*` ni `active:scale-*` fuera de `BotonReserva`.
- **Don't** usar glassmorphism (`backdrop-blur`, `bg-white/10`, `border-white/20`), halos `blur-2xl/3xl` ni desenfocar la foto del hero.
- **Don't** usar sombras teñidas de rojo ni una sola sombra muy difusa; solo Suave, Elevada o Hero.
- **Don't** usar píldoras rosadas (`bg-primario/8`) con ícono de "verificado" como sello de confianza.
- **Don't** poner Brasa (acento) en texto chico sobre claro; para eso está acento-texto.
- **Don't** usar el verde oficial `#25D366` de WhatsApp con texto blanco.
- **Don't** usar con `font-titulo` pesos que Ubuntu no carga (`font-semibold`, `font-extrabold`, `font-black`): usar `font-medium` o `font-bold`.
- **Don't** cargar fuentes a mano en un `<head>`: todo layout usa `src/components/Fuentes.astro`.
