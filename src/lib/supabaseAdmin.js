/**
 * Supabase Admin Client - Server-side only
 * Uses service role key to bypass RLS for analytics writes/reads
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;

export function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Supabase admin credentials not configured');
    return null;
  }

  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return supabaseAdmin;
}
