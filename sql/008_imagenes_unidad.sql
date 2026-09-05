-- ============================================================
-- Tierra Roja — Migración 008: imágenes del reservador editables
-- desde el Panel Admin.
--
-- Hasta ahora las fotos del carrusel de /reservar (BookingWidget)
-- estaban hardcodeadas en el componente (constante IMAGENES_UNIDAD).
-- Se mueven a la tabla `unidades` para que la dueña las suba/reordene
-- desde "Configuración → Imágenes del reservador".
--
-- Correr en el SQL Editor de Supabase después de 007.
-- ============================================================

-- ------------------------------------------------------------
-- Columna nueva: lista ordenada de imágenes por unidad.
-- Cada entrada es un string:
--   - path relativo dentro del bucket `unidades` (ej: "motorhome/ab12….webp")
--     para las fotos que sube la dueña, o
--   - ruta estática que empieza con "/" (ej: "/images/camping/camping.webp")
--     para las que vienen en el repo.
-- La app resuelve cada entrada a URL pública en src/lib/imagenes-unidad.ts.
-- ------------------------------------------------------------
alter table unidades
  add column if not exists imagenes jsonb not null default '[]'::jsonb;

-- Seed con las rutas que hoy están hardcodeadas en BookingWidget.tsx,
-- para que el carrusel no quede vacío tras la migración.
update unidades set imagenes = '["/images/camping/camping.webp"]'::jsonb
  where tipo = 'CAMPING' and imagenes = '[]'::jsonb;

update unidades set imagenes = '[
  "/images/motorhome/motorhome.webp",
  "/images/motorhome/parcelas_motorhome.webp",
  "/images/motorhome/parrillas_motorhome.webp"
]'::jsonb
  where tipo = 'MOTORHOME' and imagenes = '[]'::jsonb;

update unidades set imagenes = '["/images/cabanhas/cabanha.webp"]'::jsonb
  where tipo = 'CABANA' and imagenes = '[]'::jsonb;

update unidades set imagenes = '["/images/quinchos/quincho.webp"]'::jsonb
  where tipo = 'QUINCHOS' and imagenes = '[]'::jsonb;

-- ------------------------------------------------------------
-- Bucket de Storage para las fotos que sube la dueña.
-- `public = true`: lectura anónima directa (el carrusel las muestra sin
-- pasar por un endpoint). La escritura siempre va por /api/panel/admin/**
-- con la service_role key, que ignora RLS — no hacen falta policies.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('unidades', 'unidades', true)
on conflict (id) do nothing;
