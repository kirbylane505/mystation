import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

// POST — Upload photo/video to album
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const email = formData.get('email');
    const albumId = formData.get('albumId');
    const caption = formData.get('caption') || null;
    const type = formData.get('type') || 'photo';

    if (!file || !email || !albumId) {
      return NextResponse.json({ error: 'file, email, and albumId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: creator } = await supabase
      .from('creators')
      .select('id, slug')
      .eq('email', email)
      .eq('subscription_status', 'active')
      .maybeSingle();

    if (!creator) {
      return NextResponse.json({ error: 'Active creator account required' }, { status: 403 });
    }

    // Verify album belongs to creator
    const { data: album } = await supabase
      .from('creator_albums')
      .select('id, cover_url')
      .eq('id', albumId)
      .eq('creator_id', creator.id)
      .maybeSingle();

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Upload file to Supabase Storage
    const filename = file.name || 'upload';
    const ext = filename.split('.').pop() || 'jpg';
    const key = `${creator.slug}/gallery/${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('creator-content')
      .upload(key, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('[gallery/upload] Storage error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('creator-content')
      .getPublicUrl(key);

    // Get max sort_order for auto-increment
    const { data: lastItem } = await supabase
      .from('creator_gallery_items')
      .select('sort_order')
      .eq('album_id', albumId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (lastItem?.sort_order ?? -1) + 1;

    // Insert gallery item
    const { data: item, error: dbError } = await supabase
      .from('creator_gallery_items')
      .insert({
        album_id: albumId,
        creator_id: creator.id,
        type,
        media_url: publicUrl,
        thumbnail_url: type === 'photo' ? publicUrl : null,
        caption,
        sort_order: nextOrder,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[gallery/upload] DB error:', dbError);
      return NextResponse.json({ error: 'Failed to save gallery item' }, { status: 500 });
    }

    // Auto-set album cover to first item if no cover exists
    if (!album.cover_url) {
      await supabase
        .from('creator_albums')
        .update({ cover_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', albumId);
    }

    return NextResponse.json({ item });
  } catch (err) {
    console.error('[gallery/upload] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

// DELETE — Remove gallery item
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const itemId = searchParams.get('itemId');

    if (!email || !itemId) {
      return NextResponse.json({ error: 'email and itemId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('email', email)
      .eq('subscription_status', 'active')
      .maybeSingle();

    if (!creator) {
      return NextResponse.json({ error: 'Active creator account required' }, { status: 403 });
    }

    // Verify item belongs to creator
    const { data: existing } = await supabase
      .from('creator_gallery_items')
      .select('id')
      .eq('id', itemId)
      .eq('creator_id', creator.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Gallery item not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('creator_gallery_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error('[gallery/upload] Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete gallery item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[gallery/upload] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}
