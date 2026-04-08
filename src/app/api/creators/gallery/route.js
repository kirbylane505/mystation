import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

// GET — List albums (with items) for a creator
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const email = searchParams.get('email');
    const viewerEmail = searchParams.get('viewerEmail');

    if (!slug && !email) {
      return NextResponse.json({ error: 'slug or email required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Resolve creator
    let query = supabase
      .from('creators')
      .select('id, email, slug')
      .eq('subscription_status', 'active');

    if (email) {
      query = query.eq('email', email);
    } else {
      query = query.eq('slug', slug);
    }

    const { data: creator } = await query.maybeSingle();

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Determine visibility level
    let allowedVisibilities = ['public'];

    if (viewerEmail) {
      if (viewerEmail === creator.email) {
        // Owner sees everything
        allowedVisibilities = ['public', 'followers', 'subscribers'];
      } else {
        // Check subscriber status
        const { data: sub } = await supabase
          .from('subscribers')
          .select('id')
          .eq('email', viewerEmail)
          .eq('status', 'active')
          .maybeSingle();

        if (sub) {
          allowedVisibilities = ['public', 'followers', 'subscribers'];
        } else {
          // Check follower status
          const { data: follower } = await supabase
            .from('creator_followers')
            .select('id')
            .eq('creator_id', creator.id)
            .eq('email', viewerEmail)
            .maybeSingle();

          if (follower) {
            allowedVisibilities = ['public', 'followers'];
          }
        }
      }
    }

    // If fetching by email (dashboard), owner sees all
    if (email) {
      allowedVisibilities = ['public', 'followers', 'subscribers'];
    }

    // Fetch albums
    const { data: albums, error: albumError } = await supabase
      .from('creator_albums')
      .select('*')
      .eq('creator_id', creator.id)
      .in('visibility', allowedVisibilities)
      .order('sort_order', { ascending: true });

    if (albumError) {
      console.error('[gallery] Albums query error:', albumError);
      return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 });
    }

    if (!albums || albums.length === 0) {
      return NextResponse.json({ albums: [] });
    }

    // Fetch items for all albums
    const albumIds = albums.map(a => a.id);
    const { data: items, error: itemsError } = await supabase
      .from('creator_gallery_items')
      .select('*')
      .in('album_id', albumIds)
      .order('sort_order', { ascending: true });

    if (itemsError) {
      console.error('[gallery] Items query error:', itemsError);
      return NextResponse.json({ error: 'Failed to fetch gallery items' }, { status: 500 });
    }

    // Attach items to their albums
    const itemsByAlbum = {};
    for (const item of (items || [])) {
      if (!itemsByAlbum[item.album_id]) {
        itemsByAlbum[item.album_id] = [];
      }
      itemsByAlbum[item.album_id].push(item);
    }

    const albumsWithItems = albums.map(album => ({
      ...album,
      items: itemsByAlbum[album.id] || [],
    }));

    return NextResponse.json({ albums: albumsWithItems });
  } catch (err) {
    console.error('[gallery] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

// POST — Create album
export async function POST(request) {
  try {
    const { email, name, visibility } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'email and name required' }, { status: 400 });
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

    // Get max sort_order for auto-increment
    const { data: lastAlbum } = await supabase
      .from('creator_albums')
      .select('sort_order')
      .eq('creator_id', creator.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (lastAlbum?.sort_order ?? -1) + 1;

    const { data: album, error: insertError } = await supabase
      .from('creator_albums')
      .insert({
        creator_id: creator.id,
        name,
        visibility: visibility || 'public',
        sort_order: nextOrder,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[gallery] Create album error:', insertError);
      return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
    }

    return NextResponse.json({ album });
  } catch (err) {
    console.error('[gallery] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

// PATCH — Update album
export async function PATCH(request) {
  try {
    const { email, albumId, name, visibility, cover_url, sort_order } = await request.json();

    if (!email || !albumId) {
      return NextResponse.json({ error: 'email and albumId required' }, { status: 400 });
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

    // Verify album belongs to creator
    const { data: existing } = await supabase
      .from('creator_albums')
      .select('id')
      .eq('id', albumId)
      .eq('creator_id', creator.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Build update object with only provided fields
    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (visibility !== undefined) updates.visibility = visibility;
    if (cover_url !== undefined) updates.cover_url = cover_url;
    if (sort_order !== undefined) updates.sort_order = sort_order;

    const { data: album, error: updateError } = await supabase
      .from('creator_albums')
      .update(updates)
      .eq('id', albumId)
      .select()
      .single();

    if (updateError) {
      console.error('[gallery] Update album error:', updateError);
      return NextResponse.json({ error: 'Failed to update album' }, { status: 500 });
    }

    return NextResponse.json({ album });
  } catch (err) {
    console.error('[gallery] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

// DELETE — Delete album (cascades items via FK)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const albumId = searchParams.get('albumId');

    if (!email || !albumId) {
      return NextResponse.json({ error: 'email and albumId required' }, { status: 400 });
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

    // Verify album belongs to creator
    const { data: existing } = await supabase
      .from('creator_albums')
      .select('id')
      .eq('id', albumId)
      .eq('creator_id', creator.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('creator_albums')
      .delete()
      .eq('id', albumId);

    if (deleteError) {
      console.error('[gallery] Delete album error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[gallery] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}
