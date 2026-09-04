// ── Precios "desde" que se muestran en la web pública ─────────────────────
//
// IMPORTANTE: los precios reales de cada reserva NO viven acá. Se cargan en
// el Panel Admin y se guardan en Supabase (`opciones_precio`); el widget de
// /reservar los pide a /api/precios y calcula el total real.
//
// Este archivo existe solo para el bloque "Desde $…" de la landing, que es
// contenido estático (la home es prerenderizada). Es un dato de marketing,
// no la fuente de verdad del cobro.
//
// ⚠️ PARA COMPLETAR: poner en `desde` el valor mínimo real de cada tipo de
// alojamiento, en pesos argentinos. Mientras sea `null`, la web muestra
// "Consultar precio" y un enlace a WhatsApp — nunca un número inventado.
// Al cambiarlos, actualizar también `vigenciaTemporada`.

export type TipoAlojamiento = 'CAMPING' | 'MOTORHOME' | 'CABANA';

export interface PrecioDesde {
  /** Valor mínimo por noche en ARS. `null` = todavía sin cargar. */
  desde: number | null;
  /** Deep-link al widget de reserva con la unidad ya elegida. */
  unidad: TipoAlojamiento;
  /** Icono de Material Symbols. */
  icono: string;
  /** Foto real del predio para la tarjeta. */
  imagen: string;
}

export const PRECIOS: Record<TipoAlojamiento, PrecioDesde> = {
  // El camping se cobra por persona y por noche (ver sql/003, ítems
  // MENOR / MAYOR): el "desde" corresponde a una persona.
  CAMPING: {
    desde: null, // ⚠️ COMPLETAR
    unidad: 'CAMPING',
    icono: 'forest',
    imagen: '/images/camping/camping.webp',
  },
  // Motorhome se cobra por vehículo y por noche, e incluye 2 personas
  // (ver /reservar): el "desde" corresponde a un motorhome chico.
  MOTORHOME: {
    desde: null, // ⚠️ COMPLETAR
    unidad: 'MOTORHOME',
    icono: 'airport_shuttle',
    imagen: '/images/motorhome/motorhome.webp',
  },
  // La cabaña tiene precio fijo por noche para hasta 8 personas.
  CABANA: {
    desde: null, // ⚠️ COMPLETAR
    unidad: 'CABANA',
    icono: 'cottage',
    imagen: '/images/cabanhas/cabanha.webp',
  },
};

/** Temporada / fecha de última actualización de los precios de arriba. */
export const VIGENCIA_PRECIOS: string | null = null; // ⚠️ COMPLETAR (ej: 'Temporada 2026')

/** ¿Hay al menos un precio cargado? Si no, la sección lo dice sin inventar. */
export const HAY_PRECIOS = Object.values(PRECIOS).some((p) => p.desde !== null);

const LOCALES: Record<string, string> = { es: 'es-AR', pt: 'pt-BR', en: 'en-US' };

/** Formatea un monto en ARS según el idioma del visitante. */
export function formatearPrecio(monto: number, idioma: string): string {
  return monto.toLocaleString(LOCALES[idioma] ?? 'es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });
}

/**
 * Rango de precios para schema.org (`priceRange`). Mientras no haya precios
 * cargados devuelve '$$', que es la señal genérica que ya usaba el sitio.
 */
export function rangoDePrecios(): string {
  const valores = Object.values(PRECIOS)
    .map((p) => p.desde)
    .filter((v): v is number => v !== null);
  if (!valores.length) return '$$';
  return `ARS ${Math.min(...valores)}–${Math.max(...valores)}`;
}
