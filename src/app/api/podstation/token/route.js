import { NextResponse } from 'next/server';
import { createToken } from '@/lib/livekit';

export async function POST(req) {
  try {
    const { roomName, userName, isPublisher } = await req.json();

    if (!roomName || !userName) {
      return NextResponse.json({ error: 'Missing roomName or userName' }, { status: 400 });
    }

    const token = await createToken(roomName, userName, isPublisher || false);

    return NextResponse.json({ token });
  } catch (err) {
    console.error('PodStation token error:', err);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
