/**
 * MYSTATION - News / Blog
 * SEO-rich content: LOTL updates, music releases, foundation news
 */

import Link from 'next/link';
import { Calendar, ArrowRight, Flame, Music, Heart, Tv, ShoppingBag, Users } from 'lucide-react';

export const metadata = {
  title: 'News & Updates',
  description: 'Latest news from Mike Page, IDMG, Love on the Lawn Festival, and the Mike Page Foundation. New music, events, and community updates.',
  openGraph: {
    title: 'News & Updates | MyStation',
    description: 'Latest from Mike Page, Love on the Lawn Festival, and the Mike Page Foundation.',
  },
};

const posts = [
  {
    id: 'lotl-2026-announced',
    date: 'February 2026',
    category: 'Festival',
    categoryColor: 'orange',
    icon: Flame,
    title: 'Love on the Lawn 2026 Announced',
    excerpt: 'The biggest Hip-Hop/R&B festival in the Midwest is back. September 5, 2026 in Elgin, IL. 10,000 capacity. Lineup coming soon.',
    content: 'Love on the Lawn returns for 2026 with our biggest production yet. 10,000 capacity, multiple stages, food vendors, and community activations. Early bird merch bundles available now — spend $50+ and get 25% off tickets, spend $100+ and get a FREE ticket. Mark your calendars: September 5, 2026.',
    link: '/lotl',
    linkText: 'Get Festival Details',
  },
  {
    id: 'cubist-bet-plus',
    date: 'February 2026',
    category: 'Artist',
    categoryColor: 'purple',
    icon: Tv,
    title: 'The Cubist on BET+ "I Got a Story to Tell" Season 2',
    excerpt: 'IDMG artist Tyrell "The Cubist" Thornton brings 100M+ streams to BET+ this April. Credits include French Montana, Max B, and Pooh Shiesty.',
    content: 'The Cubist, one of IDMG\'s flagship artists, will appear on Season 2 of BET+\'s "I Got a Story to Tell" premiering April 2026. With over 100 million streams and views, and production credits spanning French Montana, Max B, Big30, Pooh Shiesty, and Blac Youngsta, The Cubist represents the future of IDMG.',
    link: '/artists/the-cubist',
    linkText: 'Read Full Bio',
  },
  {
    id: 'mystation-launch',
    date: 'February 2026',
    category: 'Platform',
    categoryColor: 'blue',
    icon: Music,
    title: 'MyStation Is Live — Stream Free',
    excerpt: 'Our official music platform is live. Stream 30+ tracks free, shop exclusive merch, and support the Mike Page Foundation with every play.',
    content: 'MyStation is now live at mystationlive.com. Stream Mike Page\'s full catalog for free — 4 songs per session, unlimited with a $4.99/mo subscription. All proceeds support youth music programs, community meals, and scholarships through the Mike Page Foundation. Available as a PWA on mobile.',
    link: '/music',
    linkText: 'Start Streaming',
  },
  {
    id: 'merch-drop-2026',
    date: 'February 2026',
    category: 'Merch',
    categoryColor: 'pink',
    icon: ShoppingBag,
    title: 'Official Merch Store Now Open — 40+ Products',
    excerpt: 'IDMG, LOTL, and MPF branded merch is here. Tees, hoodies, hats, bags, accessories, and bundle deals with festival ticket discounts.',
    content: 'Over 40 official merch items are now available at mystationlive.com/merch. Shop IDMG, Love on the Lawn, and Mike Page Foundation gear. Bundle 5+ items for 15% off. Spend $50+ on merch and unlock 25% off LOTL tickets. Spend $100+ and get a FREE ticket. Every purchase supports the Mike Page Foundation.',
    link: '/merch',
    linkText: 'Shop Now',
  },
  {
    id: 'feed-my-friends',
    date: 'January 2026',
    category: 'Foundation',
    categoryColor: 'green',
    icon: Heart,
    title: 'Feed My Friends — Community Outreach Continues',
    excerpt: 'Free meals, free clothes, free blankets, free tents. The Mike Page Foundation shows up for the community every month.',
    content: 'Feed My Friends is the Mike Page Foundation\'s community outreach initiative. Every month, our volunteer team provides free hot meals, clothing, blankets, coats, and tents to community members in need. 100% of donations go directly to those who need it. Want to help? Visit our About page or donate through MyStation.',
    link: '/about',
    linkText: 'Learn More',
  },
  {
    id: 'referral-program',
    date: 'February 2026',
    category: 'Community',
    categoryColor: 'blue',
    icon: Users,
    title: 'Invite Friends, Both Get 15% Off Merch',
    excerpt: 'Share your referral link with friends. When they visit MyStation, you both unlock 15% off any merch purchase.',
    content: 'We just launched the MyStation referral program. Share your unique link, and when friends visit, you both get 15% off merch. It\'s our way of rewarding the community that supports us. Find your referral link at the bottom of any page.',
    link: '/merch',
    linkText: 'Start Sharing',
  },
];

const colorMap = {
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
};

export default function NewsPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-screen-xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            News & <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Updates</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            The latest from Mike Page, IDMG, Love on the Lawn Festival, and the Mike Page Foundation.
          </p>
        </div>

        {/* Featured Post */}
        {(() => { const FeaturedIcon = posts[0].icon; const fc = colorMap[posts[0].categoryColor]; return (
        <div className="mb-12">
          <Link href={posts[0].link} className="block group">
            <div className="relative overflow-hidden rounded-3xl p-[1px]" style={{ background: 'linear-gradient(90deg, #f97316, #ec4899, #8b5cf6)' }}>
              <div className="bg-mystation-navyDark rounded-[22px] p-8 md:p-12">
                <div className={`inline-flex items-center gap-2 px-3 py-1 ${fc.bg} border ${fc.border} rounded-full mb-4`}>
                  <FeaturedIcon size={12} className={fc.text} />
                  <span className={`${fc.text} text-xs font-bold uppercase`}>{posts[0].category}</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4 group-hover:text-blue-400 transition">{posts[0].title}</h2>
                <p className="text-white/60 text-lg mb-4 max-w-3xl">{posts[0].content}</p>
                <div className="flex items-center gap-4">
                  <span className="text-white/30 text-sm flex items-center gap-1"><Calendar size={14} /> {posts[0].date}</span>
                  <span className="text-blue-400 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    {posts[0].linkText} <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
        ); })()}

        {/* Post Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.slice(1).map((post) => {
            const colors = colorMap[post.categoryColor];
            const Icon = post.icon;
            return (
              <Link key={post.id} href={post.link} className="block group">
                <div className="glass rounded-2xl border border-white/10 p-6 h-full hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 ${colors.bg} border ${colors.border} rounded-full mb-4`}>
                    <Icon size={12} className={colors.text} />
                    <span className={`${colors.text} text-xs font-bold uppercase`}>{post.category}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition">{post.title}</h3>
                  <p className="text-white/50 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/30 text-xs flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                    <span className="text-blue-400 font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
