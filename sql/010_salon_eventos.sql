-- ============================================================
-- Tierra Roja — Migración 010: salón de eventos (unidad privada).
--
-- La dueña alquila un salón de eventos y quiere llevar en el mismo
-- Calendario cuándo está ocupado. No se ofrece en la web: no tiene
-- precios, fotos ni reserva online. La ocupación se registra con bloqueos
-- de la unidad entera (ver sql/009_bloqueos.sql), con el detalle del
-- evento en la nota.
--
-- Que sea privada no depende de la base sino de la app: TIPOS_PUBLICOS en
-- src/lib/reservas.ts es la lista blanca que usan /api/precios,
-- /api/disponibilidad y /api/reservar.
--
-- Correr en el SQL Editor de Supabase después de 009_bloqueos.sql.
-- IMPORTANTE: en DOS pasos. Postgres no deja usar un valor de enum nuevo en
-- la misma transacción que lo crea, y el SQL Editor corre todo el texto
-- como una sola. Primero el PASO 1 solo, después el PASO 2.
-- ============================================================

-- PASO 1 ------------------------------------------------------
alter type tipo_unidad add value if not exists 'SALON';

-- PASO 2 ------------------------------------------------------
-- Unidad única, igual que la cabaña: sin cupo ni parcelas.
insert into unidades (tipo, nombre, cupo_total)
values ('SALON', 'Salón', null)
on conflict (tipo) do nothing;
