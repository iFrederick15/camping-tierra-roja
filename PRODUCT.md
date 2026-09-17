# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Huéspedes (web pública).** El público principal son **familias argentinas** que viajan a Puerto Iguazú (casi siempre en auto o motorhome) para ver las Cataratas y buscan dónde quedarse con chicos. Llegan mayormente desde el celular, comparan con otros campings de la zona y deciden entre consultar por WhatsApp o reservar directo. Segundo público: **visitantes brasileños** (Foz do Iguaçu está al lado; la cercanía a la frontera es su argumento de venta). Tercero: viajeros de habla inglesa. Solo reservan mayores de 18 años.

**Equipo de Tierra Roja (Panel).** Dos roles:
- **Staff**: uso diario en recepción/mostrador. Ver quién llega y quién se va hoy, buscar una reserva por nombre o DNI, cargar reservas de quien llama o se acerca, registrar pagos, hacer check-in y check-out.
- **Admin** (la dueña): todo lo anterior más vista operativa, calendario de ocupación, configuración de cupos/precios/plazos/imágenes del reservador, y reportes mensuales.

## Product Purpose

Tierra Roja - Camping y Parque Acuático es un predio en Puerto Iguazú, Misiones, abierto todo el año, con camping, parcelas para motorhome, una cabaña, quinchos y tres piscinas.

El sistema tiene dos partes sobre la misma base de datos:
- **Portal público**: que el visitante conozca el predio y **reserve online sin crear cuenta**, o consulte por WhatsApp.
- **Panel**: que el equipo gestione reservas, pagos y ocupación sin planillas paralelas; lo que reserva un visitante aparece al instante en el panel, y lo que carga el staff descuenta disponibilidad pública.

Éxito: más reservas directas confirmadas (y pagadas) desde la web, menos consultas perdidas, y un staff que resuelve el día sin doble carga.

## Positioning

Lo que un camping vecino no puede decir con verdad:
1. **Parque acuático incluido**: tres piscinas (Diversión, con cortina de agua y pérgola; Familiar, con tres toboganes; Relax, con cascada y solo adultos), abiertas todo el año y **sin cargo aparte** con cualquier reserva de camping, motorhome o cabaña.
2. **25 parcelas para motorhome** con luz y agua, asignadas automáticamente.
3. **Reserva online directa** en 4 pasos, contra disponibilidad real, sin cuenta ni contraseña, en vez de depender solo de WhatsApp.

Contexto de ubicación confirmado: a unos 20 minutos del Parque Nacional Iguazú (Cataratas) y del centro de Puerto Iguazú.

## Operating Context

- **Flujo de reserva pública**: Alojamiento (Camping / Motorhome / Cabaña / Quincho) → Fechas y personas → Datos (nombre, DNI, email, teléfono) → Confirmación. Se recibe un email con el monto de la seña y el plazo para transferir.
- **Pago**: siempre por **transferencia bancaria**, verificada a mano por el staff. El sitio no procesa tarjetas ni pagos online.
- **Plazo de seña**: configurable; por defecto 48 h si faltan 3 días o más para el ingreso, 6 h si faltan menos. Vencido sin pago, la reserva web se cancela sola (tarea automática). Las reservas manuales no vencen.
- **Check-in** requiere al menos un pago registrado; **check-out** requiere pago completo.
- **Calendario admin**: una fila por lugar físico (o carril virtual de cupo en Camping), barras por reserva con estados Reserva / Checkin / Adeudado / Checkout; se crea una reserva clickeando o arrastrando sobre celdas vacías.
- **Consulta por WhatsApp** con mensaje precargado en el idioma del visitante; es un canal central, no un extra.
- La web pública se recorre sobre todo en celular (hay barra de reserva fija en mobile).

## Capabilities and Constraints

- **Stack**: Astro 5 + Tailwind 4, React solo donde hace falta (widget de reserva, piezas del panel); Supabase (datos, auth, Storage); Resend (emails); Vercel (hosting + cron).
- **Idiomas**: español en la raíz, `/pt` y `/en` con slugs traducidos. Mapa de rutas único en `src/i18n/config.ts`. El Panel es solo en español.
- **Español neutro** (tuteo, sin voseo): nada de "reservá / consultá / tenés".
- **Datos del negocio centralizados** en `src/lib/` (`negocio.ts` para nombre, dirección, teléfono, WhatsApp, redes). No reescribir NAP a mano.
- **Unidades**: Camping (por cupo de personas), Motorhome (25 parcelas), Cabaña (una sola, hasta 8 personas), Quincho (por día, categorías Chico / Grande / Especial / Compartido).
- **Bloqueo de fechas**: desde el Calendario del Panel, la dueña deshabilita fechas de un lugar puntual (parcela / quincho) o de toda una unidad, con nota opcional. Esas fechas dejan de ofrecerse en la web (tabla `bloqueos`, `sql/009_bloqueos.sql`).
- **Piscinas**: beneficio informativo incluido; no se reservan ni se venden desde el sistema. Si existe un pase de día, se gestiona fuera del sistema (**sin definir**).
- **Home liviana**: no carga JavaScript externo; React se hidrata solo en la página de reserva. La fuente de iconos se sirve recortada: un icono nuevo debe sumarse a `src/lib/iconos.ts`.
- **Guía de atractivos** (`/atractivos`): 34 fichas del descriptivo oficial de la ACATI más mapa descargable.
- **Sin definir / pendiente** (ver `DATOS-PENDIENTES.md`): precios "desde" por alojamiento; tiempos a la frontera con Brasil, Foz do Iguaçu, aeropuerto IGR y Hito Tres Fronteras; tres respuestas del FAQ; datos bancarios del email de confirmación; dominio propio y analytics en producción.

## Brand Commitments

- Nombre: **Tierra Roja - Camping y Parque Acuático**. Logo y assets de marca en `public/images/marca/`.
- **Que no parezca hecha con IA**: nada de look de plantilla. Dato concreto y verificable antes que adjetivo; sin eslóganes con paralelismo, superlativos vacíos, "¿Listo para…?" ni "vive la experiencia". Es un negocio real que compite con campings de Puerto Iguazú y la credibilidad es la prioridad.
- **Nunca inventar** precios, distancias, horarios, testimonios ni reseñas. Si un dato falta, se muestra un texto neutro ("Consultar precio", "Consulta el tiempo de viaje") y se registra como pendiente.
- Canales oficiales: Instagram y TikTok `@tierraroja_iguazu`, Facebook `tierrarojaiguazu`, WhatsApp +54 3757 31-7593.

## Evidence on Hand

- **Reseñas reales de Google**: `src/lib/resenas.ts` trae rating, cantidad y hasta 5 reseñas en vivo vía Places API; si no hay clave o falla, usa 5 reseñas copiadas del perfil tal cual. No hay otros testimonios.
- **Fotos propias del predio** en `public/images/` (piscinas, camping, motorhome, cabañas, quinchos, canchas, general). La documentación de cliente señala que hubo fotos de stock en Galería y Cabaña: verificar que una foto sea del predio antes de usarla como prueba.
- **Imágenes del reservador**: editables por la dueña desde el Panel (Supabase Storage).
- **Contenido oficial**: fichas de atractivos ACATI (`src/lib/atractivos.ts`) y PDF en `public/documentos/atractivos-iguazu.pdf`.
- **Ausentes, no fabricar**: precios públicos, distancias no confirmadas, premios, cifras de huéspedes, certificaciones, horarios de piscina más allá de lo publicado.

## Product Principles

1. **Dato antes que promesa.** Cada afirmación de la web se puede verificar en el predio o en una fuente real; lo que no está confirmado no se publica.
2. **Reservar directo tiene que ser más fácil que preguntar.** Sin cuenta, pocos pasos, disponibilidad real; WhatsApp queda como vía humana, no como único camino.
3. **Las piscinas incluidas son el argumento.** Es la diferencia que la competencia no puede copiar y la que decide a una familia.
4. **Una sola verdad para huésped y staff.** Lo que ve el visitante y lo que opera el equipo salen de los mismos datos; nada de doble carga.
5. **El panel sirve al mostrador.** Rapidez para el caso del día (llega, paga, se va) por encima de la exhaustividad.
