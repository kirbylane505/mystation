import CommunityFeed from '@/components/community/CommunityFeed';

export const metadata = {
  title: 'Community | MyStation',
  description: 'Connect with the MyStation community. Music talk, events, announcements, and more.',
};

export default function CommunityPage() {
  return (
    <div className="min-h-screen">
      <section className="relative py-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-mystation-navy to-mystation-black" />
        <div className="relative max-w-2xl mx-auto px-4">
          <CommunityFeed />
        </div>
      </section>
    </div>
  );
}
