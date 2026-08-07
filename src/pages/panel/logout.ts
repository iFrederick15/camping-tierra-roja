import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/supabase-server';

export const POST: APIRoute = async ({ cookies, request, redirect }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  await supabase.auth.signOut();
  return redirect('/panel/login');
};
