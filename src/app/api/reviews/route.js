/**
 * MYSTATION - Product Reviews API (Supabase-backed)
 * GET: Fetch reviews for a product
 * POST: Add a review with optional photo
 *
 * Uses 'product_reviews' table:
 * CREATE TABLE IF NOT EXISTS product_reviews (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   product_slug text NOT NULL,
 *   username text NOT NULL,
 *   rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
 *   review text NOT NULL,
 *   photo_url text DEFAULT NULL,
 *   is_verified boolean DEFAULT false,
 *   created_at timestamptz DEFAULT now()
 * );
 * CREATE INDEX idx_product_reviews_slug ON product_reviews (product_slug);
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const rateLimits = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimits.get(ip);
  if (!record || now - record.firstAt > 600000) {
    rateLimits.set(ip, { count: 1, firstAt: now });
    return true;
  }
  if (record.count >= 3) return false;
  record.count++;
  return true;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) return NextResponse.json({ reviews: [], avg: 0, count: 0 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ reviews: [], avg: 0, count: 0 });

  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_slug', slug)
      .order('created_at', { ascending: false });

    if (error) {
      // Table might not exist yet — return empty
      if (error.code === '42P01') return NextResponse.json({ reviews: [], avg: 0, count: 0 });
      console.error('Reviews fetch error:', error.message);
      return NextResponse.json({ reviews: [], avg: 0, count: 0 });
    }

    const reviews = (data || []).map(r => ({
      id: r.id,
      username: r.username,
      rating: r.rating,
      review: r.review,
      photoUrl: r.photo_url,
      isVerified: r.is_verified,
      createdAt: r.created_at,
    }));

    const count = reviews.length;
    const avg = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

    return NextResponse.json({ reviews, avg: Math.round(avg * 10) / 10, count });
  } catch (err) {
    console.error('Reviews GET error:', err);
    return NextResponse.json({ reviews: [], avg: 0, count: 0 });
  }
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many reviews. Try again later.' }, { status: 429 });
    }

    const formData = await request.formData();
    const slug = formData.get('slug');
    const username = formData.get('username');
    const rating = parseInt(formData.get('rating'));
    const review = formData.get('review');
    const photo = formData.get('photo');

    if (!slug || !username?.trim() || !review?.trim() || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'All fields required (name, rating 1-5, review)' }, { status: 400 });
    }

    const cleanName = escapeHtml(username.trim().slice(0, 50));
    const cleanReview = escapeHtml(review.trim().slice(0, 1000));

    let photoUrl = null;

    // Upload photo to Supabase Storage if provided
    if (photo && photo.size > 0) {
      if (photo.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Photo must be under 5MB' }, { status: 400 });
      }

      const ext = photo.name?.split('.').pop()?.toLowerCase() || 'jpg';
      if (!['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext)) {
        return NextResponse.json({ error: 'Photo must be JPG, PNG, or WebP' }, { status: 400 });
      }

      const supabase = getSupabaseAdmin();
      if (supabase) {
        const filename = `reviews/${slug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const buffer = Buffer.from(await photo.arrayBuffer());
        const { error: uploadErr } = await supabase.storage
          .from('public')
          .upload(filename, buffer, { contentType: photo.type, upsert: false });

        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('public').getPublicUrl(filename);
          photoUrl = urlData?.publicUrl || null;
        }
      }
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('product_reviews')
      .insert({
        product_slug: slug,
        username: cleanName,
        rating,
        review: cleanReview,
        photo_url: photoUrl,
        is_verified: false,
      })
      .select('*')
      .single();

    if (error) {
      // Create table if it doesn't exist
      if (error.code === '42P01') {
        await supabase.rpc('exec_sql', {
          sql: `CREATE TABLE IF NOT EXISTS product_reviews (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            product_slug text NOT NULL,
            username text NOT NULL,
            rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
            review text NOT NULL,
            photo_url text DEFAULT NULL,
            is_verified boolean DEFAULT false,
            created_at timestamptz DEFAULT now()
          ); CREATE INDEX IF NOT EXISTS idx_product_reviews_slug ON product_reviews (product_slug);`
        }).catch(() => {});
        // Retry insert
        const { data: retryData, error: retryErr } = await supabase
          .from('product_reviews')
          .insert({
            product_slug: slug,
            username: cleanName,
            rating,
            review: cleanReview,
            photo_url: photoUrl,
            is_verified: false,
          })
          .select('*')
          .single();
        if (retryErr) {
          console.error('Reviews retry insert error:', retryErr.message);
          return NextResponse.json({ error: 'Failed to post review' }, { status: 500 });
        }
        return NextResponse.json({
          review: {
            id: retryData.id,
            username: retryData.username,
            rating: retryData.rating,
            review: retryData.review,
            photoUrl: retryData.photo_url,
            isVerified: retryData.is_verified,
            createdAt: retryData.created_at,
          },
          success: true,
        });
      }
      console.error('Reviews insert error:', error.message);
      return NextResponse.json({ error: 'Failed to post review' }, { status: 500 });
    }

    return NextResponse.json({
      review: {
        id: data.id,
        username: data.username,
        rating: data.rating,
        review: data.review,
        photoUrl: data.photo_url,
        isVerified: data.is_verified,
        createdAt: data.created_at,
      },
      success: true,
    });
  } catch (err) {
    console.error('Reviews POST error:', err);
    return NextResponse.json({ error: 'Failed to post review' }, { status: 500 });
  }
}
