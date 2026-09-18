-- ============================================================
-- Tierra Roja — Migración 015: un pago no puede superar el saldo.
-- El endpoint ya valida, pero dos pagos registrados a la vez leerían el
-- mismo saldo; acá se bloquea la fila de la reserva antes de comparar.
-- Mantiene el paso REALIZADA → CONFIRMADA de 012.
-- Correr en el SQL Editor de Supabase después de 014.
-- ============================================================

create or replace function registrar_pago(
  p_reserva_id uuid,
  p_monto numeric,
  p_metodo text,
  p_nota text,
  p_registrado_por text
) returns void as $$
declare
  v_total numeric;
  v_pagado numeric;
begin
  select monto_total, monto_pagado into v_total, v_pagado
  from reservas
  where id = p_reserva_id
  for update;

  if v_pagado + p_monto > v_total then
    raise exception 'SALDO_EXCEDIDO';
  end if;

  insert into pagos (reserva_id, monto, metodo, nota, registrado_por)
  values (p_reserva_id, p_monto, p_metodo, p_nota, p_registrado_por);

  update reservas
  set monto_pagado = monto_pagado + p_monto,
      estado = case when estado = 'REALIZADA' then 'CONFIRMADA'::estado_reserva else estado end
  where id = p_reserva_id;
end;
$$ language plpgsql;
