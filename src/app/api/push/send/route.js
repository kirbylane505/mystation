import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getWebPush } from '@/lib/push';

const ADMIN_KEY = process.env.ADMIN_KEY || 'mtix-admin-2026';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const authHeader = request.headers.get('x-admin-key');
    if (authHeader !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, url, image } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Missing title or body' }, { status: 400 });
    }

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('active', true);

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const payload = JSON.stringify({ title, body, url: url || '/', image });

    let sent = 0;
    let failed = 0;
    const stale = [];

    await Promise.allSettled(
      subs.map(async (sub) => {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };
        try {
          await getWebPush().sendNotification(pushSub, payload);
          sent++;
        } catch (err) {
          failed++;
          if (err.statusCode === 404 || err.statusCode === 410) {
            stale.push(sub.endpoint);
          }
        }
      })
    );

    if (stale.length > 0) {
      await supabase
        .from('push_subscriptions')
        .update({ active: false })
        .in('endpoint', stale);
    }

    return NextResponse.json({ sent, failed, stale: stale.length, total: subs.length });
  } catch (err) {
    console.error('Push send error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
