import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { postId, pinned, adminKey } = await request.json();

    const ADMIN_KEY = process.env.ADMIN_KEY;
    if (!ADMIN_KEY || !adminKey || adminKey.length !== ADMIN_KEY.length ||
        !timingSafeEqual(Buffer.from(adminKey), Buffer.from(ADMIN_KEY))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const { error } = await supabase
      .from('fan_wall')
      .update({ is_pinned: !!pinned })
      .eq('id', postId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, pinned: !!pinned });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
