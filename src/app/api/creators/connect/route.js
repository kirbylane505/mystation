import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const stripe = getStripe();

    // Get creator record
    const { data: creator, error } = await supabase
      .from('creators')
      .select('id, slug, display_name, stripe_connect_id')
      .eq('email', email)
      .maybeSingle();

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    let connectId = creator.stripe_connect_id;

    // Create Connect account if not exists
    if (!connectId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        metadata: {
          creator_id: creator.id,
          creator_slug: creator.slug,
          source: 'mystation-creator',
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      connectId = account.id;

      await supabase
        .from('creators')
        .update({ stripe_connect_id: connectId, updated_at: new Date().toISOString() })
        .eq('id', creator.id);
    }

    // Create onboarding link
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mystationlive.com').trim();

    const accountLink = await stripe.accountLinks.create({
      account: connectId,
      refresh_url: `${appUrl}/creators/onboarding?refresh=true`,
      return_url: `${appUrl}/dashboard`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error('[creator-connect] Error:', err);
    return NextResponse.json({ error: err.message || 'Connect setup failed' }, { status: 500 });
  }
}
