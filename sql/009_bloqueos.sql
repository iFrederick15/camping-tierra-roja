-- ============================================================
-- Tierra Roja — Migración 009: bloqueos de disponibilidad.
--
-- La dueña necesita "deshabilitar" fechas desde el Calendario (igual que
-- bloquear fechas en Airbnb): mantenimiento de una parcela, uso propio de
-- la cabaña, un evento privado que ocupa todo el camping. Hasta ahora la
-- única forma de sacar lugar del stock era desactivar la parcela entera
-- (parcelas.activa = false), que no tiene fechas: la saca para siempre.
--
-- Un bloqueo ocupa lugar exactamente igual que una reserva, pero no tiene
-- cliente, precio ni email. Es una fila aparte y no una reserva fantasma
-- para que nunca se cuele en reportes, pendientes de pago ni llegadas del
-- día.
--
-- Correr en el SQL Editor de Supabase después de 008_imagenes_unidad.sql.
-- ============================================================

create table if not exists bloqueos (
  id uuid primary key default gen_random_uuid(),
  unidad_id uuid not null references unidades(id) on delete cascade,

  -- A qué alcanza el bloqueo (ver src/lib/reservas.ts → obtenerDisponibilidad):
  --   parcela_id con valor      → ese lugar puntual (motorhome / quincho).
  --   parcela_id null, plazas N → N lugares del cupo genérico (camping).
  --   parcela_id null, plazas null → la unidad entera (cabaña, o cerrar todo
  --                                  el camping / todos los motorhomes).
  parcela_id uuid references parcelas(id) on delete cascade,
  plazas int,

  fecha_inicio date not null,
  fecha_fin date not null, -- exclusiva, mismo criterio que reservas.fecha_salida

  nota text,          -- opcional: "Mantenimiento", "Uso propio", etc.
  creado_por text,    -- nombre del usuario Admin que lo creó
  creado_en timestamptz not null default now(),

  constraint bloqueo_rango_valido check (fecha_fin > fecha_inicio),
  constraint bloqueo_plazas_positivas check (plazas is null or plazas >= 1),
  -- Un bloqueo de parcela ya es "un lugar": plazas solo tiene sentido para
  -- el cupo genérico del camping, que no tiene parcelas.
  constraint bloqueo_parcela_sin_plazas check (parcela_id is null or plazas is null)
);

create index if not exists idx_bloqueos_unidad_fechas
  on bloqueos (unidad_id, fecha_inicio, fecha_fin);

alter table bloqueos enable row level security;
-- Sin policies públicas: solo accesible vía supabaseAdmin (backend), igual
-- que reservas/pagos en 001. El Portal público nunca lee esta tabla directo,
-- solo ve su efecto a través de /api/disponibilidad.
