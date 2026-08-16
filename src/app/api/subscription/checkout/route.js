/**
 * MYSTATION — Stripe Checkout Session Creator (PWYW)
 * Creates a subscription checkout for the fan's chosen monthly amount
 * using Stripe's inline price_data.unit_amount (no fixed Price IDs).
 */

import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, amount_cents } = body;

    // Validation
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 },
      );
    }

    const amount = Number(amount_cents);
    if (!Number.isInteger(amount) || amount < 100 || amount > 99900) {
      return NextResponse.json(
        {
          error:
            "amount_cents must be an integer between 100 ($1) and 99900 ($999)",
        },
        { status: 400 },
      );
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Grandfather safety: check for existing active sub
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    let customerId;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      if (subs.data.length > 0) {
        return NextResponse.json(
          {
            error:
              "You already have an active subscription. Manage it in your account.",
            existing_subscription_id: subs.data[0].id,
          },
          { status: 409 },
        );
      }
    }

    const APP_URL =
      process.env.NEXT_PUBLIC_APP_URL || "https://mystationlive.com";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId, // undefined = Stripe creates new
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "MyStation Supporter",
              description:
                "Monthly support for IDMG artists and Mike Page Foundation programs.",
            },
            unit_amount: amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "subscription",
        tier: "supporter",
        amount_cents: String(amount),
      },
      subscription_data: {
        metadata: {
          type: "subscription",
          tier: "supporter",
          amount_cents: String(amount),
        },
      },
      success_url: `${APP_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/subscribe`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("subscription/checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session", detail: err?.message },
      { status: 500 },
    );
  }
}
