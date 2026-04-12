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

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export async function POST(request) {
  try {
    const { email, password, displayName, category, customCategory } = await request.json();

    if (!email || !password || !displayName || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validCategories = ['musician', 'podcaster', 'producer', 'dj', 'content_creator', 'fitness_wellness', 'barber_stylist', 'visual_artist', 'chef_food', 'educator_coach', 'comedian', 'model_fashion', 'custom'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const supabase = getSupabase();
    const stripe = getStripe();

    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        return NextResponse.json({ error: 'Email already registered. Log in instead.' }, { status: 409 });
      }
      console.error('[creator-signup] Auth error:', authError);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    const userId = authData.user.id;

    // 2. Generate unique slug
    let slug = slugify(displayName);
    const { data: existing } = await supabase
      .from('creators')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // 3. Create creator record
    const { error: creatorError } = await supabase
      .from('creators')
      .insert({
        user_id: userId,
        email,
        slug,
        display_name: displayName,
        category,
        custom_category: category === 'custom' ? (customCategory || null) : null,
        subscription_status: 'inactive',
      });

    if (creatorError) {
      console.error('[creator-signup] Creator insert error:', creatorError);
      return NextResponse.json({ error: 'Failed to create creator profile' }, { status: 500 });
    }

    // 4. Create Stripe checkout for $14.99/mo creator subscription
    const priceId = process.env.STRIPE_PRICE_CREATOR?.trim();
    if (!priceId) {
      return NextResponse.json({ error: 'Creator pricing not configured' }, { status: 500 });
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mystationlive.com').trim();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: {
        source: 'creator-signup',
        creator_user_id: userId,
        creator_slug: slug,
      },
      success_url: `${appUrl}/creators/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/creators/signup?canceled=true`,
    });

    return NextResponse.json({
      url: session.url,
      slug,
    });
  } catch (err) {
    console.error('[creator-signup] Error:', err);
    return NextResponse.json({ error: err.message || 'Signup failed' }, { status: 500 });
  }
}
