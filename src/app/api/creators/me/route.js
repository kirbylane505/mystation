import { NextResponse } from 'next/server';
import { getCreatorByEmail } from '@/lib/creatorAuth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const creator = await getCreatorByEmail(email);

  if (!creator) {
    return NextResponse.json({ creator: null });
  }

  // Don't expose sensitive fields
  const { stripe_customer_id, stripe_connect_id, subscription_id, ...safe } = creator;
  return NextResponse.json({ creator: safe });
}
