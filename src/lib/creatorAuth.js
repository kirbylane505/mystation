import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function getCreatorByEmail(email) {
  if (!email) return null;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('creators')
    .select('*')
    .eq('email', email)
    .eq('subscription_status', 'active')
    .maybeSingle();
  return data;
}
