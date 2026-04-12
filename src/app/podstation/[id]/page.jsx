import { Suspense } from 'react';
import StreamView from '@/components/podstation/StreamView';
import { createClient } from '@supabase/supabase-js';
import { Radio } from 'lucide-react';

const supabaseAdmin = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

export async function generateMetadata({ params }) {
  const { id } = await params;

  if (!supabaseAdmin) {
    return { title: 'Live Stream | MyStation' };
  }

  const { data: stream } = await supabaseAdmin
    .from('streams')
    .select('title, user_name, is_live')
    .eq('id', id)
    .single();

  if (!stream) {
    return { title: 'Stream Not Found | MyStation' };
  }

  const liveText = stream.is_live ? 'LIVE NOW' : 'Replay';

  return {
    title: `${stream.user_name} is LIVE | MyStation`,
    description: stream.title,
    openGraph: {
      title: `${stream.user_name} is LIVE on MyStation`,
      description: `${stream.title} — Watch now on PodStation`,
      images: [`/api/og?title=${encodeURIComponent(stream.title)}&artist=${encodeURIComponent(stream.user_name)}&album=${encodeURIComponent(liveText)}&year=PodStation`],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${stream.user_name} is LIVE on MyStation`,
      description: stream.title,
    },
  };
}

async function getStream(id) {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from('streams')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

export default async function StreamPage({ params }) {
  const { id } = await params;
  const stream = await getStream(id);

  return (
    <div className="min-h-screen py-4">
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <Radio className="w-8 h-8 text-orange-500 animate-pulse" />
        </div>
      }>
        <StreamView stream={stream} />
      </Suspense>
    </div>
  );
}
