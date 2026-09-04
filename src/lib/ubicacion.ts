// ── Distancias y puntos de interés alrededor del camping ──────────────────
//
// El principal argumento de venta de Tierra Roja para el turismo nacional e
// internacional es la ubicación: es la base para visitar las Cataratas y
// cruzar a Brasil. Estos datos alimentan la sección "Tu base para descubrir
// Iguazú" en los tres idiomas.
//
// REGLA: `confirmado: false` significa que el dato NO está verificado. La web
// no lo muestra como número: renderiza el destino sin tiempo de viaje. En
// cuanto se confirme, poner el valor y `confirmado: true`.

export interface PuntoDeInteres {
  /** Clave para buscar el nombre traducido en los diccionarios de i18n. */
  clave: 'cataratas' | 'centro' | 'brasil' | 'foz' | 'aeropuerto' | 'tresFronteras';
  /** Minutos en auto. null = sin confirmar. */
  minutos: number | null;
  confirmado: boolean;
  icono: string;
}

export const PUNTOS_DE_INTERES: PuntoDeInteres[] = [
  // Dato ya publicado en el sitio (página de Contacto): ~20 minutos.
  { clave: 'cataratas', minutos: 20, confirmado: true, icono: 'water_drop' },
  { clave: 'centro', minutos: 20, confirmado: true, icono: 'storefront' },
  // ⚠️ COMPLETAR: minutos reales hasta el paso fronterizo (Puente Tancredo
  // Neves) y hasta el centro de Foz do Iguaçu.
  { clave: 'brasil', minutos: null, confirmado: false, icono: 'swap_horiz' },
  { clave: 'foz', minutos: null, confirmado: false, icono: 'public' },
  // ⚠️ COMPLETAR: minutos hasta el Aeropuerto Internacional de Puerto Iguazú
  // (IGR) y hasta el Hito Tres Fronteras.
  { clave: 'aeropuerto', minutos: null, confirmado: false, icono: 'flight' },
  { clave: 'tresFronteras', minutos: null, confirmado: false, icono: 'flag' },
];
