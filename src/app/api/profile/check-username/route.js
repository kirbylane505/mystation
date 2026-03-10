/**
 * MYSTATION — Check Username Availability
 * GET: ?username=desired_name
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { USERNAME_REGEX } from '@/lib/profiles/constants';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username')?.toLowerCase().trim();

    if (!username || !USERNAME_REGEX.test(username)) {
      return NextResponse.json({ available: false, error: 'Invalid username format' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ available: false, error: 'Database not configured' });
    }

    const { data } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', username)
      .single();

    return NextResponse.json({ available: !data, username });
  } catch (err) {
    return NextResponse.json({ available: false, error: 'Check failed' });
  }
}
