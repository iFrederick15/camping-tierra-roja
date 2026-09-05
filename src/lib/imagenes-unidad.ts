// Imágenes del carrusel de /reservar (BookingWidget), editables desde el
// Panel Admin (Configuración → Imágenes del reservador). Ver
// sql/008_imagenes_unidad.sql.
//
// En `unidades.imagenes` (jsonb) se guarda una lista ordenada de strings:
//   - path dentro del bucket `unidades` (ej: "motorhome/ab12….webp"): foto
//     subida por la dueña.
//   - ruta que empieza con "/" (ej: "/images/camping/camping.webp"): foto
//     estática del repo (el seed de la migración usa estas).
// Este módulo es el único lugar que traduce esa lista a URLs mostrables.
import { supabaseAdmin } from './supabase';

export const BUCKET_IMAGENES_UNIDAD = 'unidades';

// Formatos y peso aceptados al subir desde el Panel. WebP primero: es lo que
// ya usa todo el sitio y pesa menos. El tope es 3 MB: las funciones
// serverless de Vercel rechazan un body de más de ~4,5 MB (archivo +
// envoltura multipart) y las fotos no se optimizan en el server.
export const TIPOS_IMAGEN_PERMITIDOS = ['image/webp', 'image/jpeg', 'image/png'] as const;
export const TAMANO_MAXIMO_IMAGEN = 3 * 1024 * 1024; // 3 MB

const EXTENSION_POR_TIPO: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export function extensionParaTipo(tipo: string): string | null {
  return EXTENSION_POR_TIPO[tipo] ?? null;
}

/** ¿La entrada guardada es una foto subida al bucket (no una ruta estática)? */
export function esPathDeStorage(entrada: string): boolean {
  return !entrada.startsWith('/') && !/^https?:\/\//.test(entrada);
}

/** Resuelve una entrada guardada a una URL que el navegador puede mostrar. */
export function urlPublicaImagen(entrada: string): string {
  if (!esPathDeStorage(entrada)) return entrada;
  const { data } = supabaseAdmin.storage.from(BUCKET_IMAGENES_UNIDAD).getPublicUrl(entrada);
  return data.publicUrl;
}

/** Normaliza el jsonb de la fila (puede venir null / no-array / con basura). */
export function normalizarImagenes(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
}

/** Lista de URLs públicas listas para el carrusel. */
export function urlsPublicasImagenes(valor: unknown): string[] {
  return normalizarImagenes(valor).map(urlPublicaImagen);
}
