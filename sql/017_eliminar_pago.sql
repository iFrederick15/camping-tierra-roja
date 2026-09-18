-- ============================================================
-- Tierra Roja — Migración 017: eliminar un pago cargado por error.
-- Solo Admin (api/panel/reservas/[id]/pagos/[pagoId].ts). Borra la fila de
-- "pagos" y resta el monto de reservas.monto_pagado en la misma transacción,
-- con la fila de la reserva bloqueada como registrar_pago (sql/015).
-- El pago desaparece de la tabla y de los reportes de caja; para no perder
-- el rastro, se deja una nota interna con el detalle, quién lo borró y el
-- motivo.
-- Estado, con la regla de sql/012 y sql/016: si ya no queda ningún pago y
-- hay algo por cobrar, CONFIRMADA vuelve a REALIZADA. Los demás estados
-- (check-in, check-out, cancelada) no cambian.
-- Correr en el SQL Editor de Supabase después de 016.
-- ============================================================

create or replace function eliminar_pago(
  p_reserva_id uuid,
  p_pago_id uuid,
  p_motivo text,
  p_por text
) returns void as $$
declare
  v_total numeric;
  v_pagado numeric;
  v_pago pagos%rowtype;
begin
  select monto_total, monto_pagado into v_total, v_pagado
  from reservas
  where id = p_reserva_id
  for update;

  delete from pagos
  where id = p_pago_id and reserva_id = p_reserva_id
  returning * into v_pago;

  if v_pago.id is null then
    raise exception 'PAGO_NO_ENCONTRADO';
  end if;

  v_pagado := greatest(0, v_pagado - v_pago.monto);

  update reservas
  set monto_pagado = v_pagado,
      estado = case
        when estado = 'CONFIRMADA' and v_pagado <= 0 and v_total > 0
          then 'REALIZADA'::estado_reserva
        else estado
      end
  where id = p_reserva_id;

  insert into comentarios_reserva (reserva_id, texto, autor)
  values (
    p_reserva_id,
    format(
      'Pago eliminado: $%s (%s) registrado por %s el %s. Motivo: %s',
      v_pago.monto,
      v_pago.metodo,
      coalesce(v_pago.registrado_por, 'sin dato'),
      to_char(v_pago.creado_en at time zone 'America/Argentina/Buenos_Aires', 'DD/MM/YYYY HH24:MI'),
      p_motivo
    ),
    p_por
  );
end;
$$ language plpgsql;
