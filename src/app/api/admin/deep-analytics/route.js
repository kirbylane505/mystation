/**
 * MYSTATION - Deep Analytics API
 * Pulls Stripe revenue + enhanced Supabase analytics
 * Protected by admin key (timing-safe)
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { timingSafeEqual } from 'crypto';
import Stripe from 'stripe';

function verifyAdminKey(key) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || !key) return false;
  try {
    return timingSafeEqual(Buffer.from(key), Buffer.from(adminKey));
  } catch { return false; }
}

// Parse user agent into browser, OS, device model
function parseUA(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', model: 'Unknown', isPWA: false, isCarPlay: false };

  const isPWA = /standalone|wv|WebView/i.test(ua) || !/Safari/i.test(ua) && /AppleWebKit/i.test(ua);
  const isCarPlay = /CarPlay/i.test(ua);

  let browser = 'Other';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\//i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';

  let os = 'Other';
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';

  let model = 'Unknown';
  const iphone = ua.match(/iPhone\s*([\d,]+)/);
  const ipad = ua.match(/iPad/);
  const android = ua.match(/;\s*([^;)]+)\s*Build\//);
  const samsung = ua.match(/SM-[A-Z]\d+/i);
  if (iphone) model = 'iPhone';
  else if (ipad) model = 'iPad';
  else if (samsung) model = samsung[0];
  else if (android) model = android[1].trim();

  return { browser, os, model, isPWA, isCarPlay };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = request.headers.get('x-admin-key') || searchParams.get('key');
  if (!verifyAdminKey(key)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // --- SECTION 1: REVENUE (Stripe) ---
    let revenue = { balance: 0, charges: [], byType: {} };
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const balance = await stripe.balance.retrieve();
        revenue.balance = balance.available.reduce((sum, b) => sum + b.amount, 0) +
                          balance.pending.reduce((sum, b) => sum + b.amount, 0);

        // Last 100 successful charges
        const charges = await stripe.charges.list({ limit: 100, status: 'succeeded' });
        let subTotal = 0, merchTotal = 0, tipTotal = 0, ticketTotal = 0, vpodTotal = 0, otherTotal = 0;
        let subCount = 0, merchCount = 0, tipCount = 0, ticketCount = 0, vpodCount = 0, otherCount = 0;

        for (const ch of charges.data) {
          const desc = (ch.description || '').toLowerCase();
          const meta = ch.metadata || {};
          const amt = ch.amount;

          if (meta.source === 'vpod' || desc.includes('vpod')) {
            vpodTotal += amt; vpodCount++;
          } else if (desc.includes('subscription') || desc.includes('invoice')) {
            subTotal += amt; subCount++;
          } else if (meta.type === 'merch' || desc.includes('merch') || desc.includes('printify')) {
            merchTotal += amt; merchCount++;
          } else if (meta.type === 'tip' || desc.includes('tip')) {
            tipTotal += amt; tipCount++;
          } else if (meta.type === 'ticket' || desc.includes('ticket') || desc.includes('lotl')) {
            ticketTotal += amt; ticketCount++;
          } else {
            otherTotal += amt; otherCount++;
          }
        }

        revenue.byType = {
          subscriptions: { total: subTotal, count: subCount },
          merch: { total: merchTotal, count: merchCount },
          tips: { total: tipTotal, count: tipCount },
          tickets: { total: ticketTotal, count: ticketCount },
          vpod: { total: vpodTotal, count: vpodCount },
          other: { total: otherTotal, count: otherCount },
        };
        revenue.allTimeTotal = subTotal + merchTotal + tipTotal + ticketTotal + vpodTotal + otherTotal;
      } catch (stripeErr) {
        revenue.error = stripeErr.message;
      }
    }

    // --- SECTION 2: LISTENER INTELLIGENCE ---
    // Get all analytics plays with ip_hash
    const { data: recentPlays } = await supabase
      .from('analytics_events')
      .select('ip_hash, track_title, created_at, city, region')
      .eq('event_type', 'play')
      .order('created_at', { ascending: false })
      .limit(5000);

    // Get subscribers
    const { data: subscribers } = await supabase
      .from('subscribers')
      .select('email, name, subscribed_at')
      .eq('is_active', true);

    // Get subscriber session data to cross-reference ip_hash
    // Check if we have ip tracking on subscribers
    const { data: subSessions } = await supabase
      .from('analytics_events')
      .select('ip_hash, session_id')
      .not('ip_hash', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5000);

    // Unique listener ip_hashes with play counts
    const listenerMap = {};
    (recentPlays || []).forEach(p => {
      if (!p.ip_hash) return;
      if (!listenerMap[p.ip_hash]) {
        listenerMap[p.ip_hash] = { plays: 0, lastTrack: null, lastTime: null, city: null };
      }
      listenerMap[p.ip_hash].plays++;
      if (!listenerMap[p.ip_hash].lastTrack) {
        listenerMap[p.ip_hash].lastTrack = p.track_title;
        listenerMap[p.ip_hash].lastTime = p.created_at;
        listenerMap[p.ip_hash].city = [p.city, p.region].filter(Boolean).join(', ');
      }
    });

    const listeners = Object.entries(listenerMap)
      .sort((a, b) => b[1].plays - a[1].plays)
      .slice(0, 50)
      .map(([hash, info]) => ({
        ipHash: hash.slice(0, 8) + '...',
        plays: info.plays,
        lastTrack: info.lastTrack,
        lastTime: info.lastTime,
        city: info.city,
      }));

    // --- SECTION 3: DEEP LOCATION ---
    const { data: allEvents } = await supabase
      .from('analytics_events')
      .select('city, region, country')
      .not('city', 'is', null)
      .limit(10000);

    const cityMap = {};
    const stateMap = {};
    const countryMap = {};
    (allEvents || []).forEach(e => {
      if (e.city) {
        const cityKey = [e.city, e.region].filter(Boolean).join(', ');
        cityMap[cityKey] = (cityMap[cityKey] || 0) + 1;
      }
      if (e.region) stateMap[e.region] = (stateMap[e.region] || 0) + 1;
      if (e.country) countryMap[e.country] = (countryMap[e.country] || 0) + 1;
    });

    const topCities = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([city, count]) => ({ city, count }));

    const topStates = Object.entries(stateMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([state, count]) => ({ state, count }));

    const topCountries = Object.entries(countryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    // --- SECTION 4: DEVICE INTELLIGENCE ---
    const { data: uaEvents } = await supabase
      .from('analytics_events')
      .select('user_agent, device_type')
      .not('user_agent', 'is', null)
      .limit(5000);

    const browserMap = {};
    const osMap = {};
    const modelMap = {};
    let pwaCount = 0;
    let carplayCount = 0;

    (uaEvents || []).forEach(e => {
      const parsed = parseUA(e.user_agent);
      browserMap[parsed.browser] = (browserMap[parsed.browser] || 0) + 1;
      osMap[parsed.os] = (osMap[parsed.os] || 0) + 1;
      if (parsed.model !== 'Unknown') modelMap[parsed.model] = (modelMap[parsed.model] || 0) + 1;
      if (parsed.isPWA) pwaCount++;
      if (parsed.isCarPlay) carplayCount++;
    });

    const topBrowsers = Object.entries(browserMap).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
    const topOS = Object.entries(osMap).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
    const topModels = Object.entries(modelMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));

    // --- SECTION 5: REAL-TIME FEED ---
    const { data: feedEvents } = await supabase
      .from('analytics_events')
      .select('event_type, track_title, page_path, city, region, country, device_type, user_agent, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    const feed = (feedEvents || []).map(e => {
      const parsed = parseUA(e.user_agent);
      return {
        type: e.event_type,
        track: e.track_title,
        page: e.page_path,
        location: [e.city, e.region, e.country].filter(Boolean).join(', '),
        device: e.device_type,
        browser: parsed.browser,
        os: parsed.os,
        isPWA: parsed.isPWA,
        time: e.created_at,
      };
    });

    return NextResponse.json({
      revenue,
      listeners,
      subscriberCount: (subscribers || []).length,
      location: { topCities, topStates, topCountries, totalLocations: (allEvents || []).length },
      devices: { topBrowsers, topOS, topModels, pwaCount, carplayCount, totalScanned: (uaEvents || []).length },
      feed,
    });
  } catch (err) {
    console.error('Deep analytics error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
