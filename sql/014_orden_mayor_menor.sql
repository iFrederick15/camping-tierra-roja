-- ============================================================
-- Tierra Roja — Migración 014: en Camping, "Mayor" antes que "Menor".
-- Toda reserva de camping lleva al menos un mayor y muchas ningún menor:
-- el contador que casi todos completan va primero. El widget, el desglose
-- de precio y el panel admin siguen `opciones_precio.orden`, así que no hay
-- que tocar código.
-- Correr en el SQL Editor de Supabase después de 013.
-- ============================================================

update opciones_precio op
set orden = case op.clave when 'MAYOR' then 1 when 'MENOR' then 2 end
from unidades u
where op.unidad_id = u.id
  and u.tipo = 'CAMPING'
  and op.clave in ('MAYOR', 'MENOR');
