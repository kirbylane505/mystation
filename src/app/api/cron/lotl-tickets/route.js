/**
 * MYSTATION - LOTL 2026 Free Ticket Cron
 * Sends free tickets to first 250 subscribers still active on Aug 1, 2026
 * Scheduled: Aug 1, 2026 at 9AM ET (13:00 UTC)
 * Can also be triggered manually via GET with admin key
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendLOTLTicketEmail } from '@/lib/email';
import { createHmac } from 'crypto';

function generateTicketCode(email, number) {
  const hash = createHmac('sha256', 'lotl2026-mystation')
    .update(`${email}-${number}`)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
  return `LOTL-${hash}`;
}

export async function GET(request) {
  // Auth: Vercel CRON_SECRET or admin key
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get('key');

  const isAuthed =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    adminKey === process.env.ADMIN_KEY;

  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Get all active subscribers with subscriber_number <= 250
    const { data: eligible, error: fetchErr } = await supabase
      .from('subscribers')
      .select('email, subscriber_number')
      .eq('status', 'active')
      .lte('subscriber_number', 250)
      .order('subscriber_number', { ascending: true });

    if (fetchErr) {
      console.error('Failed to fetch eligible subscribers:', fetchErr);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!eligible || eligible.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No eligible subscribers found' });
    }

    // Send ticket to each eligible subscriber
    const results = [];
    for (const sub of eligible) {
      const ticketCode = generateTicketCode(sub.email, sub.subscriber_number);

      const result = await sendLOTLTicketEmail({
        customerEmail: sub.email,
        subscriberNumber: sub.subscriber_number,
        ticketCode,
      });

      results.push({
        email: sub.email,
        number: sub.subscriber_number,
        ticketCode,
        sent: result.success,
      });

      // Small delay between emails to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    }

    const sent = results.filter(r => r.sent).length;
    const failed = results.filter(r => !r.sent).length;

    console.log(`LOTL tickets: ${sent} sent, ${failed} failed out of ${eligible.length} eligible`);

    return NextResponse.json({
      sent,
      failed,
      total: eligible.length,
      results,
    });
  } catch (err) {
    console.error('LOTL ticket cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
