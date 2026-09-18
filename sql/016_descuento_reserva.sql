-- ============================================================
-- Tierra Roja — Migración 016: descuento aplicado desde el Panel.
-- monto_total sigue siendo lo que se cobra (ya con el descuento): pagos,
-- reportes y emails no cambian. El subtotal de lista es
-- monto_total + descuento. Al editar la reserva se recalcula el subtotal y
-- se vuelve a restar el descuento (api/panel/reservas/[id].ts).
-- El descuento puede ser del 100% ("por la casa"): con total 0 la reserva
-- cuenta como pagada (calcularEstadoPago) y el cron no la cancela.
-- Correr en el SQL Editor de Supabase después de 015. Se puede volver a
-- correr sin romper nada.
-- ============================================================

alter table reservas
  add column if not exists descuento numeric(10, 2) not null default 0 check (descuento >= 0),
  add column if not exists descuento_motivo text,
  add column if not exists descuento_por text,
  add column if not exists descuento_en timestamptz;

-- Reemplaza el descuento vigente (no se acumula); p_descuento = 0 lo quita.
-- Bloquea la fila como registrar_pago (sql/015): un pago simultáneo no puede
-- dejar monto_pagado por encima del total nuevo.
-- Estado, con la regla de sql/012 ampliada: CONFIRMADA si hay algún pago o
-- si no queda nada por cobrar; REALIZADA si vuelve a deber sin haber pagado.
create or replace function aplicar_descuento(
  p_reserva_id uuid,
  p_descuento numeric,
  p_motivo text,
  p_por text
) returns void as $$
declare
  v_subtotal numeric;
  v_pagado numeric;
begin
  select monto_total + descuento, monto_pagado into v_subtotal, v_pagado
  from reservas
  where id = p_reserva_id
  for update;

  if p_descuento < 0 or p_descuento > v_subtotal then
    raise exception 'DESCUENTO_INVALIDO';
  end if;

  if v_subtotal - p_descuento < v_pagado then
    raise exception 'DESCUENTO_BAJO_PAGADO';
  end if;

  update reservas
  set monto_total = v_subtotal - p_descuento,
      descuento = p_descuento,
      descuento_motivo = case when p_descuento > 0 then p_motivo end,
      descuento_por = case when p_descuento > 0 then p_por end,
      descuento_en = case when p_descuento > 0 then now() end,
      estado = case
        when estado not in ('REALIZADA', 'CONFIRMADA') then estado
        when v_pagado > 0 or v_subtotal - p_descuento <= 0 then 'CONFIRMADA'::estado_reserva
        else 'REALIZADA'::estado_reserva
      end
  where id = p_reserva_id;
end;
$$ language plpgsql;
