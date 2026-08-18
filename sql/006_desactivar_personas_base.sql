-- ============================================================
-- Tierra Roja — Migración 006: se descarta el ítem "PERSONAS_BASE" de
-- Motorhome (se probó como cargo separado por las primeras 2 personas, pero
-- se revirtió: el precio de la parcela CHICO/GRANDE ya incluye 2 personas,
-- solo se cobran los acompañantes que excedan eso). Se desactiva en vez de
-- borrarse, mismo criterio que 004_quitar_remolque.sql — activo=false
-- alcanza para que deje de aparecer en /api/precios, en el cálculo de
-- calcularPrecio() y en el panel de Configuración (todos filtran por
-- "activo").
-- Correr en el SQL Editor de Supabase después de 005_personas_base_motorhome.sql.
-- ============================================================

update opciones_precio
set activo = false
where clave = 'PERSONAS_BASE';
