// PATCH /api/panel/admin/configuracion-pagos — plazos de pago (48hs / plazo
// corto / umbral de anticipación). Solo-admin (gateado por middleware).
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';
import { exigirAdmin } from '../../../../lib/auth-guard';

export const PATCH: APIRoute = async ({ request, locals }) => {
  const noAutorizado = exigirAdmin(locals);
  if (noAutorizado) return noAutorizado;

  const body = await request.json();
  const horasLargo = Number(body.horasPlazoLargo);
  const horasCorto = Number(body.horasPlazoCorto);
  const diasUmbral = Number(body.diasUmbralAnticipacion);

  const entero = (n: number, max: number) => Number.isInteger(n) && n >= 0 && n <= max;
  if (!entero(horasLargo, 8760) || !entero(horasCorto, 8760) || !entero(diasUmbral, 365)) {
    return new Response(
      JSON.stringify({ error: 'Los plazos deben ser números enteros válidos' }),
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from('configuracion_pagos')
    .update({
      horas_plazo_largo: horasLargo,
      horas_plazo_corto: horasCorto,
      dias_umbral_anticipacion: diasUmbral,
    })
    .eq('id', true);

  if (error) {
    console.error('PATCH /api/panel/admin/configuracion-pagos:', error);
    return new Response(JSON.stringify({ error: 'No se pudo guardar el cambio' }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
