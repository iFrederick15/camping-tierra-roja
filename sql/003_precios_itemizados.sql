-- ============================================================
-- Tierra Roja — Migración 003: precios itemizados por unidad.
-- Reemplaza el único unidades.precio_por_noche por una lista de "ítems de
-- precio" por unidad (categoría de vehículo, remolque, acompañante, edad,
-- categoría de quincho), acordado con la dueña — ver Documento de Producto.
-- Correr en el SQL Editor de Supabase después de 002_auth_y_config.sql.
-- Todo en una transacción: si algo falla a mitad de camino (por ejemplo el
-- upsert de parcelas de Quinchos), no queda la base a medio migrar.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- Ítems de precio: cada unidad tiene 1+ filas. tipo_cargo define cómo se
-- combinan al armar el total de una reserva (ver calcularPrecio en
-- src/lib/reservas.ts):
--   BASE       → opción excluyente (radio), a lo sumo una por reserva.
--   CANTIDAD   → se multiplica por una cantidad que carga el cliente.
--   ADICIONAL  → booleano, se suma una vez si está marcado.
-- Todos los precios son por noche (se multiplican por la cantidad de
-- noches), igual que el resto del sistema.
-- ------------------------------------------------------------
create type tipo_cargo as enum ('BASE', 'CANTIDAD', 'ADICIONAL');

create table opciones_precio (
  id uuid primary key default gen_random_uuid(),
  unidad_id uuid not null references unidades(id),
  clave text not null,
  etiqueta text not null,
  tipo_cargo tipo_cargo not null,
  precio_por_noche numeric(10, 2) not null default 0,
  orden int not null default 0,
  activo boolean not null default true,
  unique (unidad_id, clave)
);

-- Los literales de tipo_cargo se castean explícitamente: en un INSERT ...
-- SELECT con UNION ALL, Postgres no infiere el tipo de la columna destino
-- dentro de cada rama como sí lo hace en un INSERT simple — sin el cast
-- resuelve el UNION completo como texto y el INSERT final falla.
insert into opciones_precio (unidad_id, clave, etiqueta, tipo_cargo, orden)
select id, 'CHICO', 'Motorhome chico (combi, camper o similar hasta 6.50m)', 'BASE'::tipo_cargo, 1
from unidades where tipo = 'MOTORHOME'
union all
select id, 'GRANDE', 'Motorhome grande (motorhome o vehículo de más de 6.50m)', 'BASE'::tipo_cargo, 2
from unidades where tipo = 'MOTORHOME'
union all
select id, 'REMOLQUE', 'Remolque (cualquier tipo de trailer, ej. casilla)', 'ADICIONAL'::tipo_cargo, 3
from unidades where tipo = 'MOTORHOME'
union all
select id, 'ACOMPANANTE', 'Acompañante', 'CANTIDAD'::tipo_cargo, 4
from unidades where tipo = 'MOTORHOME'
union all
select id, 'MENOR', 'Menor (entre 3 y 7 años)', 'CANTIDAD'::tipo_cargo, 1
from unidades where tipo = 'CAMPING'
union all
select id, 'MAYOR', 'Mayor (más de 7 años)', 'CANTIDAD'::tipo_cargo, 2
from unidades where tipo = 'CAMPING'
union all
select id, 'FIJO', 'Cabaña (precio fijo)', 'BASE'::tipo_cargo, 1
from unidades where tipo = 'CABANA'
union all
select id, 'CHICO', 'Quincho chico (hasta 12 personas)', 'BASE'::tipo_cargo, 1
from unidades where tipo = 'QUINCHOS'
union all
select id, 'GRANDE', 'Quincho grande (hasta 25 personas)', 'BASE'::tipo_cargo, 2
from unidades where tipo = 'QUINCHOS'
union all
select id, 'ESPECIAL', 'Quincho especial (hasta 30 personas)', 'BASE'::tipo_cargo, 3
from unidades where tipo = 'QUINCHOS'
union all
select id, 'COMPARTIDO', 'Quincho compartido (hasta 50 personas)', 'BASE'::tipo_cargo, 4
from unidades where tipo = 'QUINCHOS';

alter table opciones_precio enable row level security;
create policy "Lectura pública de opciones de precio activas" on opciones_precio
  for select using (activo);

-- ------------------------------------------------------------
-- unidades.precio_por_noche queda reemplazado por opciones_precio (incluida
-- Cabaña, que ahora tiene una única fila FIJO). Evita mantener dos sistemas
-- de precio en paralelo.
-- ------------------------------------------------------------
alter table unidades drop column precio_por_noche;

-- ------------------------------------------------------------
-- Parcelas de Quinchos: cada una queda atada a su categoría de precio, así
-- obtenerDisponibilidad() puede filtrar por categoría elegida. Upsert en vez
-- de borrar+reinsertar: si ya existe una reserva real sobre alguna de las 3
-- parcelas sembradas en 002, borrarlas violaría la FK reservas.parcela_id →
-- parcelas(id). "on conflict" solo actualiza la categoría de precio de las
-- que ya existen (1-3, si las hubiera) y agrega las que faltan hasta 10,
-- sin tocar nombre/atributos/activa que Staff pueda haber personalizado.
-- ------------------------------------------------------------
alter table parcelas add column opcion_precio_id uuid references opciones_precio(id);

insert into parcelas (unidad_id, numero, nombre, atributos, opcion_precio_id)
select u.id, n, 'Quincho ' || n, '{}'::text[],
  (select op.id from opciones_precio op where op.unidad_id = u.id and op.clave = 'CHICO')
from unidades u, generate_series(1, 6) as n
where u.tipo = 'QUINCHOS'
on conflict (unidad_id, numero) do update set opcion_precio_id = excluded.opcion_precio_id;

insert into parcelas (unidad_id, numero, nombre, atributos, opcion_precio_id)
select u.id, n, 'Quincho ' || n, '{}'::text[],
  (select op.id from opciones_precio op where op.unidad_id = u.id and op.clave = 'GRANDE')
from unidades u, generate_series(7, 8) as n
where u.tipo = 'QUINCHOS'
on conflict (unidad_id, numero) do update set opcion_precio_id = excluded.opcion_precio_id;

insert into parcelas (unidad_id, numero, nombre, atributos, opcion_precio_id)
select u.id, 9, 'Quincho 9', '{}'::text[],
  (select op.id from opciones_precio op where op.unidad_id = u.id and op.clave = 'ESPECIAL')
from unidades u where u.tipo = 'QUINCHOS'
on conflict (unidad_id, numero) do update set opcion_precio_id = excluded.opcion_precio_id;

insert into parcelas (unidad_id, numero, nombre, atributos, opcion_precio_id)
select u.id, 10, 'Quincho 10', '{}'::text[],
  (select op.id from opciones_precio op where op.unidad_id = u.id and op.clave = 'COMPARTIDO')
from unidades u where u.tipo = 'QUINCHOS'
on conflict (unidad_id, numero) do update set opcion_precio_id = excluded.opcion_precio_id;

-- ------------------------------------------------------------
-- Reservas: guardan qué ítems se cobraron (para mostrarle el desglose a
-- Staff) y las cantidades que hoy determinan precio o son solo informativas.
-- ------------------------------------------------------------
alter table reservas
  add column categoria_seleccionada text,       -- MOTORHOME/QUINCHOS: clave de la opción BASE elegida
  add column remolque boolean not null default false,
  add column cantidad_menores int not null default 0,  -- CAMPING: cobra. CABANA: informativo.
  add column cantidad_mayores int not null default 0,  -- CAMPING: cobra. CABANA: informativo.
  add column detalle_precio jsonb not null default '[]';

commit;
