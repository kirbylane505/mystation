import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const { postId, optionIndex } = await request.json();
    if (!postId || optionIndex === undefined) {
      return NextResponse.json({ error: 'postId and optionIndex required' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const voter_ip_hash = createHash('sha256').update(ip + 'community-vote-salt').digest('hex').slice(0, 16);

    const { error } = await supabase
      .from('community_votes')
      .upsert({ post_id: postId, voter_ip_hash, option_index: optionIndex }, { onConflict: 'post_id,voter_ip_hash' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: votes } = await supabase
      .from('community_votes')
      .select('option_index')
      .eq('post_id', postId);

    const counts = {};
    (votes || []).forEach(v => { counts[v.option_index] = (counts[v.option_index] || 0) + 1; });

    return NextResponse.json({ success: true, counts, myVote: optionIndex });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ counts: {} });

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    if (!postId) return NextResponse.json({ counts: {} });

    const { data: votes } = await supabase
      .from('community_votes')
      .select('option_index')
      .eq('post_id', postId);

    const counts = {};
    (votes || []).forEach(v => { counts[v.option_index] = (counts[v.option_index] || 0) + 1; });

    return NextResponse.json({ counts });
  } catch {
    return NextResponse.json({ counts: {} });
  }
}
