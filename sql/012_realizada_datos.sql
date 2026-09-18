-- ============================================================
-- Tierra Roja — Migración 012: estado REALIZADA (parte 2 de 2).
--
-- Requiere 011 y el deploy del código nuevo (ver el orden en 011).
--
-- Regla: sin ningún pago la reserva está REALIZADA; con al menos un pago
-- (la seña o cualquier importe a cuenta) está CONFIRMADA. Vale para
-- reservas web y manuales. Es la misma condición que ya habilita el
-- check-in (puedeHacerCheckin en src/lib/reservas.ts).
-- ============================================================

-- Datos existentes, en las dos direcciones: las CONFIRMADA sin pago pasan a
-- REALIZADA, y las que el código nuevo haya creado como REALIZADA y cobrado
-- antes de esta migración pasan a CONFIRMADA.
update reservas set estado = 'REALIZADA'
where estado = 'CONFIRMADA' and monto_pagado <= 0;

update reservas set estado = 'CONFIRMADA'
where estado = 'REALIZADA' and monto_pagado > 0;

alter table reservas alter column estado set default 'REALIZADA';

-- El primer pago confirma la reserva. Vive en la misma función que suma el
-- pago para que no haya ningún momento con pago registrado y estado viejo.
create or replace function registrar_pago(
  p_reserva_id uuid,
  p_monto numeric,
  p_metodo text,
  p_nota text,
  p_registrado_por text
) returns void as $$
begin
  insert into pagos (reserva_id, monto, metodo, nota, registrado_por)
  values (p_reserva_id, p_monto, p_metodo, p_nota, p_registrado_por);

  update reservas
  set monto_pagado = monto_pagado + p_monto,
      estado = case when estado = 'REALIZADA' then 'CONFIRMADA'::estado_reserva else estado end
  where id = p_reserva_id;
end;
$$ language plpgsql;
