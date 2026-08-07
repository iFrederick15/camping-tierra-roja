-- ============================================================
-- Tierra Roja — Migración 002: perfiles (roles Staff/Admin),
-- seed de parcelas de Quinchos, configuración de plazos de pago.
-- Correr en el SQL Editor de Supabase después de 001_schema.sql.
-- ============================================================

-- ------------------------------------------------------------
-- Perfiles: guarda el rol de cada usuario de Supabase Auth.
-- No usamos user_metadata porque el propio usuario puede editarlo desde
-- el cliente (supabase.auth.updateUser) — un Staff podría auto-promoverse
-- a Admin. Esta tabla solo la escribe supabaseAdmin (backend).
-- ------------------------------------------------------------
do $$ begin
  create type rol_usuario as enum ('staff', 'admin');
exception when duplicate_object then null;
end $$;

create table if not exists perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol rol_usuario not null default 'staff',
  creado_en timestamptz not null default now()
);

alter table perfiles enable row level security;

drop policy if exists "Usuario lee su propio perfil" on perfiles;
create policy "Usuario lee su propio perfil" on perfiles
  for select using (auth.uid() = id);

-- ------------------------------------------------------------
-- Seed de parcelas de Quinchos (faltaba: la unidad QUINCHOS existe desde
-- 001 pero nunca se sembraron sus parcelas — el Portal público quedaba
-- sin opciones para reservar quinchos).
-- ------------------------------------------------------------
insert into parcelas (unidad_id, numero, nombre, atributos)
select id, n, 'Quincho ' || n, '{}'::text[]
from unidades, generate_series(1, 3) as n
where tipo = 'QUINCHOS'
on conflict (unidad_id, numero) do nothing;

-- ------------------------------------------------------------
-- Configuración de plazos de pago: hoy son constantes hardcodeadas en
-- reservar.ts (48hs / 6hs / 3 días de umbral). Se mueven acá para que
-- el bloque "Configuración de plazos de pago" del Admin pueda editarlas.
-- Fila única forzada por la constraint sobre "id".
-- ------------------------------------------------------------
create table if not exists configuracion_pagos (
  id boolean primary key default true,
  horas_plazo_largo int not null default 48,
  horas_plazo_corto int not null default 6,
  dias_umbral_anticipacion int not null default 3,
  actualizado_en timestamptz not null default now(),
  constraint solo_una_fila check (id)
);

insert into configuracion_pagos (id) values (true) on conflict (id) do nothing;

alter table configuracion_pagos enable row level security;
-- Sin policies públicas: solo accesible vía supabaseAdmin (backend), igual
-- que reservas/pagos en 001.

drop trigger if exists trg_configuracion_pagos_actualizado_en on configuracion_pagos;
create trigger trg_configuracion_pagos_actualizado_en
before update on configuracion_pagos
for each row execute function set_actualizado_en();

-- ------------------------------------------------------------
-- Registrar un pago: inserta en "pagos" y suma a reservas.monto_pagado en
-- una sola transacción implícita (las funciones plpgsql corren atómicas).
-- Evita el race condition de leer monto_pagado en JS, sumar y reescribir
-- si dos pagos de la misma reserva se registran casi al mismo tiempo.
-- ------------------------------------------------------------
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
  set monto_pagado = monto_pagado + p_monto
  where id = p_reserva_id;
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- Paso manual post-migración (no se puede scriptear: son credenciales
-- por-instalación):
-- 1. Supabase Dashboard → Authentication → Users → crear usuario Staff
--    y usuario Admin (email + password, "Auto Confirm User" activado).
-- 2. Por cada uno, copiar su UUID y correr:
--      insert into perfiles (id, nombre, rol)
--      values ('<uuid>', '<Nombre>', 'staff');  -- o 'admin'
-- ------------------------------------------------------------
