/**
 * MYTICKETSLIVE - Upload Payment Screenshot API
 * POST: Upload payment screenshot for a pending order
 * Accepts multipart form: order_ref + image file
 * Stores in Supabase Storage bucket 'payment-screenshots'
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const order_ref = formData.get('order_ref');
    const file = formData.get('file');

    if (!order_ref) {
      return NextResponse.json({ error: 'order_ref is required' }, { status: 400 });
    }

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, HEIC' },
        { status: 400 }
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    // Verify order exists and is pending
    const { data: order, error: orderError } = await supabase
      .from('ticket_orders')
      .select('id, status')
      .eq('order_ref', order_ref)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: `Order is already ${order.status}. Cannot upload screenshot.` },
        { status: 409 }
      );
    }

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const ext = file.name?.split('.').pop() || 'jpg';
    const filename = `screenshot_${Date.now()}.${ext}`;
    const storagePath = `${order_ref}/${filename}`;

    const { error: uploadError } = await supabase
      .storage
      .from('payment-screenshots')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[Upload Screenshot] Storage error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload screenshot', detail: uploadError.message },
        { status: 500 }
      );
    }

    // Update order with screenshot path
    const { error: updateError } = await supabase
      .from('ticket_orders')
      .update({
        payment_screenshot_url: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq('order_ref', order_ref);

    if (updateError) {
      console.error('[Upload Screenshot] Update error:', updateError);
      return NextResponse.json(
        { error: 'Screenshot uploaded but failed to update order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order_ref,
      screenshot_path: storagePath,
      message: 'Payment screenshot uploaded. Your order is being reviewed.',
    });
  } catch (err) {
    console.error('[Upload Screenshot] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
