-- ============================================================
-- Tierra Roja — Migración 007: comentarios de reserva.
-- Bitácora libre para que Staff/Admin dejen asentado cualquier
-- inconveniente sobre una reserva (llegó tarde, faltaba documentación,
-- problema con la parcela, etc.). Se guardan en su propia tabla —igual
-- criterio que "pagos"— para conservar autor y fecha de cada entrada, en
-- vez de un único campo de texto en "reservas" que se pisaría.
-- Correr en el SQL Editor de Supabase después de 006_desactivar_personas_base.sql.
-- ============================================================

create table if not exists comentarios_reserva (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references reservas(id) on delete cascade,
  texto text not null,
  autor text,                 -- nombre del usuario Staff/Admin que lo escribió
  creado_en timestamptz not null default now()
);

create index if not exists idx_comentarios_reserva_reserva
  on comentarios_reserva (reserva_id, creado_en);

alter table comentarios_reserva enable row level security;
-- Sin policies públicas: solo accesible vía supabaseAdmin (backend), igual
-- que reservas/pagos en 001.
