-- ============================================================
-- Tierra Roja — Schema de base de datos (Supabase / Postgres)
-- Correr esto en el SQL Editor de Supabase, una sola vez.
-- Refleja el modelo acordado: unidades, parcelas, reservas, pagos.
-- ============================================================

create extension if not exists "pgcrypto"; -- para gen_random_uuid()

-- ------------------------------------------------------------
-- Unidades: Camping (cupo genérico), Motorhome (parcelas numeradas), Quinchos (enumerados)
-- Cabaña (unidad única). Bloque "Configuración" del Admin edita esta tabla.
-- ------------------------------------------------------------
create type tipo_unidad as enum ('CAMPING', 'MOTORHOME', 'CABANA', 'QUINCHOS');

create table unidades (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_unidad not null unique,
  nombre text not null,
  precio_por_noche numeric(10, 2) not null,
  cupo_total int, -- solo aplica a CAMPING (ej: 40). Null para MOTORHOME y CABANA.
  actualizado_en timestamptz not null default now(),
  creado_en timestamptz not null default now()
);

-- Solo existen filas de parcela para la unidad MOTORHOME(25 parcelas) y Para quinchos.
-- El cliente ve "nombre" y "atributos" en el Portal. El número interno
-- (columna "numero") lo usa Staff/Admin, nunca se lo mostramos crudo al cliente.
create table parcelas (
  id uuid primary key default gen_random_uuid(),
  unidad_id uuid not null references unidades(id),
  numero int not null,
  nombre text not null,          -- ej: "Parcela 3" (lo que ve el cliente)
  atributos text[] not null default '{}', -- ej: {"Con sombra","Cerca del río"}
  activa boolean not null default true,
  unique (unidad_id, numero)
);

-- ------------------------------------------------------------
-- Reservas: el corazón del sistema.
-- ------------------------------------------------------------
create type estado_reserva as enum ('CONFIRMADA', 'CHECKIN_HECHO', 'CHECKOUT_HECHO', 'CANCELADA');
create type origen_reserva as enum ('WEB', 'MANUAL');

create table reservas (
  id uuid primary key default gen_random_uuid(),

  unidad_id uuid not null references unidades(id),
  parcela_id uuid references parcelas(id), -- solo si unidad.tipo = MOTORHOME

  -- Datos del cliente (boleta de papel digitalizada)
  nombre_cliente text not null,
  dni text not null,
  email text,          -- obligatorio si origen = WEB (se valida en la app)
  telefono text,        -- obligatorio si origen = WEB
  cantidad_acompanantes int not null default 0,
  datos_vehiculo text,
  como_nos_conocio text, -- opcional, nunca bloquea el check-in

  fecha_ingreso date not null,
  fecha_salida date not null,

  monto_total numeric(10, 2) not null,
  monto_pagado numeric(10, 2) not null default 0,
  -- El estado de pago (No pagado / Parcial / Pagado) NO se guarda: se calcula
  -- siempre en la app a partir de monto_pagado vs monto_total.

  fecha_limite_pago timestamptz, -- 48hs o plazo corto. Null si origen = MANUAL.

  estado estado_reserva not null default 'CONFIRMADA',
  origen origen_reserva not null,

  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index idx_reservas_fechas on reservas (fecha_ingreso, fecha_salida);
create index idx_reservas_estado on reservas (estado);
create index idx_reservas_dni on reservas (dni);

-- Cada pago que Staff registra manualmente (transferencia verificada, efectivo, etc.)
create table pagos (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references reservas(id),
  monto numeric(10, 2) not null,
  metodo text not null,       -- "Transferencia", "Efectivo", etc.
  nota text,
  registrado_por text,        -- nombre del usuario Staff/Admin que lo cargó
  creado_en timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Trigger simple para mantener actualizado_en al día en reservas
-- ------------------------------------------------------------
create or replace function set_actualizado_en()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_reservas_actualizado_en
before update on reservas
for each row execute function set_actualizado_en();

-- ------------------------------------------------------------
-- Datos iniciales (ajustar precios reales antes de usar en producción)
-- ------------------------------------------------------------
insert into unidades (tipo, nombre, precio_por_noche, cupo_total) values
  ('CAMPING', 'Camping', 12000, 40),
  ('MOTORHOME', 'Motorhome', 18000, null),
  ('CABANA', 'Cabaña', 45000, null),
    ('QUINCHOS', 'Quincho', 28000, null);


-- 25 parcelas de motorhome de ejemplo — ajustar atributos reales del predio
insert into parcelas (unidad_id, numero, nombre, atributos)
select id, n, 'Parcela ' || n, '{}'::text[]
from unidades, generate_series(1, 25) as n
where tipo = 'MOTORHOME';

-- ------------------------------------------------------------
-- Row Level Security: el Portal (cliente anónimo) NO debe poder leer/escribir
-- reservas directo. Todo pasa por las rutas /api/* del server (usan la
-- service_role key). Esto bloquea el acceso público a la tabla.
-- ------------------------------------------------------------
alter table reservas enable row level security;
alter table pagos enable row level security;
alter table unidades enable row level security;
alter table parcelas enable row level security;

-- Solo lectura pública de unidades y parcelas (para mostrar precios/opciones si hiciera falta)
create policy "Lectura pública de unidades" on unidades for select using (true);
create policy "Lectura pública de parcelas activas" on parcelas for select using (activa = true);
-- reservas y pagos: sin policies públicas → solo accesibles vía service_role (backend)
