import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');
    const artist = formData.get('artist');
    const album = formData.get('album') || null;
    const producer = formData.get('producer') || null;
    const creatorEmail = formData.get('email');

    if (!file || !title || !artist || !creatorEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get creator
    const { data: creator } = await supabase
      .from('creators')
      .select('id, slug, subscription_status')
      .eq('email', creatorEmail)
      .eq('subscription_status', 'active')
      .maybeSingle();

    if (!creator) {
      return NextResponse.json({ error: 'Active creator account required' }, { status: 403 });
    }

    // Upload to R2 — bucket root (IRON LAW: R2 audio at root, not subdirs)
    const ext = file.name?.split('.').pop() || 'm4a';
    const filename = `creator-${creator.slug}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'mystation-audio',
      Key: filename,
      Body: buffer,
      ContentType: file.type || 'audio/mp4',
    }));

    // Get audio duration (approximate from file size)
    const durationEstimate = Math.round(buffer.length / 16000);

    // Insert track record
    const { data: track, error } = await supabase
      .from('creator_tracks')
      .insert({
        creator_id: creator.id,
        title,
        artist,
        album,
        producer,
        audio_url: filename,
        duration: durationEstimate,
      })
      .select()
      .single();

    if (error) {
      console.error('[creator-upload] DB error:', error);
      return NextResponse.json({ error: 'Failed to save track' }, { status: 500 });
    }

    // Update creator track count
    await supabase
      .from('creators')
      .update({
        track_count: (await supabase.from('creator_tracks').select('id', { count: 'exact', head: true }).eq('creator_id', creator.id).eq('status', 'active')).count || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', creator.id);

    return NextResponse.json({ track });
  } catch (err) {
    console.error('[creator-upload] Error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
