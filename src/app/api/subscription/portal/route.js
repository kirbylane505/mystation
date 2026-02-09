/**
 * MYSTATION - Stripe Billing Portal
 * Looks up customer by email, creates portal session
 */

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, customerId, returnUrl } = await request.json();

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    let customer = customerId;

    // Look up customer by email if no ID provided
    if (!customer && email) {
      const customers = await stripe.customers.list({
        email,
        limit: 1,
      });
      if (customers.data.length > 0) {
        customer = customers.data[0].id;
      }
    }

    if (!customer) {
      return NextResponse.json({ error: 'No customer found' }, { status: 404 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer,
      return_url: returnUrl || 'https://mystationlive.com/account',
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error('Stripe portal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
