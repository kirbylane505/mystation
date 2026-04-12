import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createToken } from '@/lib/livekit';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST — Host generates invite link
export async function POST(req) {
  try {
    const { streamId, roomName } = await req.json();
    if (!streamId || !roomName) {
      return NextResponse.json({ error: 'Missing streamId or roomName' }, { status: 400 });
    }

    const code = crypto.randomUUID().slice(0, 8);

    const { error } = await supabaseAdmin
      .from('stream_invites')
      .insert({
        stream_id: streamId,
        code,
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      });

    if (error) throw error;

    return NextResponse.json({ code });
  } catch (err) {
    console.error('Invite create error:', err);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}

// GET — Guest redeems invite code, gets publisher token
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const guestName = searchParams.get('name') || 'Guest';

    if (!code) {
      return NextResponse.json({ error: 'Missing invite code' }, { status: 400 });
    }

    const { data: invite, error } = await supabaseAdmin
      .from('stream_invites')
      .select('*, streams(*)')
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
    }

    // Mark used
    await supabaseAdmin
      .from('stream_invites')
      .update({ used: true, guest_name: guestName })
      .eq('id', invite.id);

    // Generate publisher token for guest
    const token = await createToken(
      invite.streams.livekit_room_name,
      guestName + ' (Guest)',
      true
    );

    return NextResponse.json({
      token,
      roomName: invite.streams.livekit_room_name,
      streamId: invite.stream_id,
    });
  } catch (err) {
    console.error('Invite redeem error:', err);
    return NextResponse.json({ error: 'Failed to redeem invite' }, { status: 500 });
  }
}
