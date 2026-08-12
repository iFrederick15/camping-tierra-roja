-- ============================================================
-- Tierra Roja — Migración 004: se descarta el ítem "Remolque" de Motorhome
-- (decisión de producto, no se va a cobrar). Se desactiva en vez de
-- borrarse por si ya hay alguna reserva con detalle_precio que lo
-- referencia — activo=false alcanza para que deje de aparecer en
-- /api/precios y en el cálculo de calcularPrecio() (ambos filtran por
-- "activo").
-- Correr en el SQL Editor de Supabase después de 003_precios_itemizados.sql.
-- ============================================================

update opciones_precio
set activo = false
where clave = 'REMOLQUE';
