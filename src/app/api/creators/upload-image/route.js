import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type'); // 'avatar' or 'banner'
    const email = formData.get('email');

    if (!file || !type || !email) {
      return NextResponse.json({ error: 'file, type, and email required' }, { status: 400 });
    }

    if (!['avatar', 'banner'].includes(type)) {
      return NextResponse.json({ error: 'type must be avatar or banner' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: creator } = await supabase
      .from('creators')
      .select('id, slug')
      .eq('email', email)
      .maybeSingle();

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const ext = file.name?.split('.').pop() || 'jpg';
    const filename = `creators/${creator.slug}/${type}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filename, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('[upload-image] Storage error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename);

    const field = type === 'avatar' ? 'avatar_url' : 'banner_url';
    await supabase
      .from('creators')
      .update({ [field]: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', creator.id);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('[upload-image] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
