-- ============================================================
-- Tierra Roja — Migración 013: fecha y hora de check-in y check-out.
--
-- Hasta ahora solo quedaba el estado (CHECKIN_HECHO / CHECKOUT_HECHO) sin
-- saber cuándo pasó. Las completan los endpoints
-- /api/panel/reservas/[id]/checkin y /checkout al momento de hacerlos.
-- Las reservas que ya tenían check-in o check-out quedan en null: no hay
-- de dónde sacar la hora real.
--
-- ORDEN DE DESPLIEGUE: correr esta migración ANTES de deployar el código.
-- El código nuevo pide estas columnas en cada lectura de reservas; sin
-- ellas, el Panel no encuentra ninguna reserva.
-- ============================================================

alter table reservas
  add column if not exists checkin_en timestamptz,
  add column if not exists checkout_en timestamptz;
