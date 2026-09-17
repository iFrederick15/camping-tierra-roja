// Módulo deliberadamente sin dependencias.
//
// El código de reserva lo necesitan dos mundos que no deberían acoplarse: el
// email (lib/email.ts) y el Panel de Staff. Si viviera en lib/reservas.ts,
// importarlo arrastraría lib/supabase.ts, que crea el cliente al cargar el
// módulo y falla sin credenciales — con eso, armar el HTML de un email pasaría
// a exigir una conexión a la base.
//
// lib/reservas.ts lo re-exporta para que siga siendo el único punto de entrada
// de las reglas de negocio.

/**
 * Código corto que el cliente recibe en el email de confirmación y dicta al
 * llegar o por WhatsApp ("A3F91C2D"). Son los primeros 8 caracteres del uuid
 * de la reserva: con el volumen de un camping no hay riesgo real de colisión.
 *
 * El formato importa: el buscador del Panel reconoce el código con
 * `/^[0-9a-f]{8}$/i` para traducirlo a un rango de uuid. Cambiar el largo o
 * agregarle separadores rompe esa búsqueda.
 */
export function codigoReserva(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}
