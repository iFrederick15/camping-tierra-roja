// PATCH /api/panel/admin/configuracion-pagos — plazos de pago (48hs / plazo
// corto / umbral de anticipación). Solo-admin (gateado por middleware).
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';

export const PATCH: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { horasPlazoLargo, horasPlazoCorto, diasUmbralAnticipacion } = body;

  const { error } = await supabaseAdmin
    .from('configuracion_pagos')
    .update({
      horas_plazo_largo: Number(horasPlazoLargo),
      horas_plazo_corto: Number(horasPlazoCorto),
      dias_umbral_anticipacion: Number(diasUmbralAnticipacion),
    })
    .eq('id', true);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
