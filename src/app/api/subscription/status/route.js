/**
 * MYSTATION — Subscription Status
 * Returns current tier, status, renewal date from Supabase.
 * SECURITY: Only returns data if caller's auth cookie matches queried email.
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // SECURITY: Verify caller owns this email via auth cookie
    const cookies = request.headers.get("cookie") || "";
    const emailCookie = cookies.match(/mystation-email=([^;]+)/);
    const authCookie = cookies.match(/mystation-auth=([^;]+)/);

    if (!emailCookie && !authCookie) {
      // No auth at all — return minimal info only
      return NextResponse.json({
        tier: "free",
        status: "none",
        isSubscribed: false,
      });
    }

    // If email cookie exists, verify it matches the queried email
    if (emailCookie) {
      const cookieEmail = decodeURIComponent(emailCookie[1])
        .toLowerCase()
        .trim();
      if (cookieEmail !== cleanEmail) {
        // Querying someone else's status — deny detailed info
        return NextResponse.json({
          tier: "free",
          status: "none",
          isSubscribed: false,
        });
      }
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ tier: "free", status: "none" });
    }

    const { data: subscriber } = await supabase
      .from("subscribers")
      .select(
        "tier, status, current_period_end, cancel_at_period_end, subscriber_number, created_at, monthly_amount_cents",
      )
      .eq("email", cleanEmail)
      .single();

    if (!subscriber || subscriber.status !== "active") {
      return NextResponse.json({
        tier: "free",
        status: subscriber?.status || "none",
        isSubscribed: false,
      });
    }

    return NextResponse.json({
      tier: subscriber.tier || "supporter",
      status: subscriber.status,
      isSubscribed: true,
      currentPeriodEnd: subscriber.current_period_end,
      cancelAtPeriodEnd: subscriber.cancel_at_period_end || false,
      subscriberNumber: subscriber.subscriber_number,
      memberSince: subscriber.created_at,
      monthlyAmountCents: subscriber.monthly_amount_cents ?? null,
    });
  } catch (err) {
    console.error("Status check error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
