import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    supabase: 'unknown',
    stripe: 'unknown',
  };

  // Check Supabase
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase.from('subscribers').select('id', { count: 'exact', head: true });
      checks.supabase = error ? 'degraded' : 'ok';
    } else {
      checks.supabase = 'not_configured';
    }
  } catch {
    checks.supabase = 'error';
  }

  // Check Stripe
  try {
    if (process.env.STRIPE_SECRET_KEY) {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      await stripe.balance.retrieve();
      checks.stripe = 'ok';
    } else {
      checks.stripe = 'not_configured';
    }
  } catch {
    checks.stripe = 'error';
  }

  const allOk = Object.values(checks).every(v => v === 'ok' || v === 'not_configured');

  return NextResponse.json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
    checks,
  });
}
