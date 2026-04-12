import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

// Get conversations or specific thread
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const withCreatorId = searchParams.get('withCreatorId');

  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: me } = await supabase.from('creators').select('id').eq('email', email).maybeSingle();
  if (!me) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

  if (withCreatorId) {
    // Get messages in a specific conversation
    const { data: messages } = await supabase
      .from('creator_messages')
      .select('id, sender_id, receiver_id, message, read, created_at')
      .or(`and(sender_id.eq.${me.id},receiver_id.eq.${withCreatorId}),and(sender_id.eq.${withCreatorId},receiver_id.eq.${me.id})`)
      .order('created_at', { ascending: true })
      .limit(100);

    // Mark received messages as read
    await supabase
      .from('creator_messages')
      .update({ read: true })
      .eq('sender_id', withCreatorId)
      .eq('receiver_id', me.id)
      .eq('read', false);

    return NextResponse.json({ messages: messages || [], myId: me.id });
  }

  // Get all conversations (latest message per partner)
  const { data: sent } = await supabase
    .from('creator_messages')
    .select('id, sender_id, receiver_id, message, read, created_at')
    .eq('sender_id', me.id)
    .order('created_at', { ascending: false });

  const { data: received } = await supabase
    .from('creator_messages')
    .select('id, sender_id, receiver_id, message, read, created_at')
    .eq('receiver_id', me.id)
    .order('created_at', { ascending: false });

  const all = [...(sent || []), ...(received || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Group by conversation partner
  const conversations = {};
  for (const msg of all) {
    const partnerId = msg.sender_id === me.id ? msg.receiver_id : msg.sender_id;
    if (!conversations[partnerId]) {
      conversations[partnerId] = { partnerId, lastMessage: msg, unread: 0 };
    }
    if (msg.receiver_id === me.id && !msg.read) {
      conversations[partnerId].unread++;
    }
  }

  // Get partner names
  const partnerIds = Object.keys(conversations);
  if (partnerIds.length > 0) {
    const { data: partners } = await supabase
      .from('creators')
      .select('id, display_name, slug, avatar_url')
      .in('id', partnerIds);

    for (const p of (partners || [])) {
      if (conversations[p.id]) {
        conversations[p.id].partner = p;
      }
    }
  }

  return NextResponse.json({ conversations: Object.values(conversations), myId: me.id });
}

// Send a message
export async function POST(request) {
  try {
    const { email, receiverId, message } = await request.json();
    if (!email || !receiverId || !message) {
      return NextResponse.json({ error: 'email, receiverId, and message required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: me } = await supabase.from('creators').select('id').eq('email', email).maybeSingle();
    if (!me) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

    if (me.id === receiverId) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    const { data: msg, error } = await supabase
      .from('creator_messages')
      .insert({ sender_id: me.id, receiver_id: receiverId, message: message.trim() })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
    return NextResponse.json({ message: msg });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
