-- ============================================================
-- Tierra Roja — Migración 005: cargo fijo "Hasta 2 personas" para Motorhome.
-- Antes, el precio de la parcela (CHICO/GRANDE) no incluía a nadie y
-- "Acompañante" cobraba desde la primera persona. Ahora la parcela y la
-- ocupación de las primeras 2 personas son dos cargos separados; recién la
-- 3ra persona en adelante paga "Acompañante" (ver calcularPrecio en
-- src/lib/reservas.ts y calcularDetalle en src/components/BookingWidget.tsx).
-- precio_por_noche arranca en 0: Admin le carga el valor real desde
-- /panel/admin/configuracion, igual que se hizo con el resto de los ítems.
-- Correr en el SQL Editor de Supabase después de 004_quitar_remolque.sql.
-- ============================================================

insert into opciones_precio (unidad_id, clave, etiqueta, tipo_cargo, orden)
select id, 'PERSONAS_BASE', 'Hasta 2 personas', 'ADICIONAL'::tipo_cargo, 3
from unidades where tipo = 'MOTORHOME';
