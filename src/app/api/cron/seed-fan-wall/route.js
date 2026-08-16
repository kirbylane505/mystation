/**
 * MYSTATION - Daily Fan Wall Seed Posts
 * Cron job that adds 5 engaging posts daily to keep the community alive
 * Triggered by Vercel Cron or manual call
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Pool of realistic fan posts — rotates through these
const POST_POOL = [
  // Music reactions
  {
    username: "ChicagoVibes",
    content: "Crash Out on repeat all morning. Mike Page never misses 🔥",
    avatar: "🎵",
    tier: "fan",
  },
  {
    username: "SouthSideSoul",
    content:
      "Favorite Person hit different when you going through it. Real music for real people.",
    avatar: "💜",
    tier: "fan",
  },
  {
    username: "MelodyQueen",
    content: "Having My Way is that one!! Cubist went crazy on the beat",
    avatar: "👑",
    tier: "supporter",
  },
  {
    username: "BeatJunkie404",
    content:
      "The production on Rent Due is elite. Jack Thomas & The Cubist are a problem together",
    avatar: "🎧",
    tier: "fan",
  },
  {
    username: "IDMGRider",
    content:
      "4 A Min got me feeling like Im on top of the world. This catalog is DEEP",
    avatar: "🔥",
    tier: "supporter",
  },
  {
    username: "FoundationFan",
    content:
      "Love that every stream supports the Mike Page Foundation. Music with purpose 💯",
    avatar: "❤️",
    tier: "fan",
  },
  {
    username: "NightOwlATL",
    content:
      "Late night vibes with One Love on the speakers. Perfect chill track",
    avatar: "🌙",
    tier: "fan",
  },
  {
    username: "VinylHead",
    content: "10 Toes Down is a banger. Mike Page stays consistent",
    avatar: "💿",
    tier: "fan",
  },
  {
    username: "StreamQueen",
    content:
      "Just discovered MyStation and I cant stop listening. This app is fire 🔥🔥",
    avatar: "⭐",
    tier: "fan",
  },
  {
    username: "MusicLover23",
    content:
      "I Need Her is so smooth. Jack Thomas & The Cubist production is always on point",
    avatar: "🎶",
    tier: "fan",
  },

  // Community / engagement
  {
    username: "LOTLFam",
    content: "Cant wait for Love On The Lawn this year! Who else going?? 🎪",
    avatar: "🌿",
    tier: "supporter",
  },
  {
    username: "ElginNative",
    content:
      "So proud to see Mike Page Foundation doing big things in our community",
    avatar: "🏠",
    tier: "fan",
  },
  {
    username: "NewListener",
    content:
      "My friend put me on to MyStation yesterday. Already subscribed. This is different 🙌",
    avatar: "🆕",
    tier: "fan",
  },
  {
    username: "DJTurntables",
    content:
      "The DJ feature in Fan Zone is crazy!! Been mixing Crash Out into Rent Due all day",
    avatar: "🎛️",
    tier: "fan",
  },
  {
    username: "CubistFan",
    content:
      "The Cubist productions are next level. That man has 100M+ streams for a reason",
    avatar: "🏆",
    tier: "supporter",
  },
  {
    username: "MerchCollector",
    content:
      "Just copped the IDMG skully from the merch store. Quality is A1 👌",
    avatar: "🧢",
    tier: "fan",
  },
  {
    username: "DailyStreamer",
    content:
      "Day 14 of my listening streak! The points system is addicting lol",
    avatar: "🔥",
    tier: "supporter",
  },
  {
    username: "VaultHunter",
    content:
      "Almost unlocked The Vault!! Those exclusive tracks better be worth it 👀",
    avatar: "🔐",
    tier: "fan",
  },
  {
    username: "MikePageArmy",
    content:
      "Shezzy Knew It was my intro to Mike Page. Been locked in ever since. LEGEND",
    avatar: "💪",
    tier: "supporter",
  },
  {
    username: "IndieMusic847",
    content:
      "Its rare to find an artist who puts THIS much effort into their streaming platform. Respect",
    avatar: "🫡",
    tier: "fan",
  },

  // Hype / anticipation
  {
    username: "GrammyWatch",
    content: "When Grammy Nights Vol 1 drops its over for everybody 🏆🔥",
    avatar: "🌟",
    tier: "vip",
  },
  {
    username: "IDMG_Stan",
    content: "IDMG is building something special. IDMG Empire on the rise",
    avatar: "🚀",
    tier: "supporter",
  },
  {
    username: "ATLBassHead",
    content: "The bass on Crash Out through good speakers is INSANE",
    avatar: "🔊",
    tier: "fan",
  },
  {
    username: "ChillMood",
    content:
      "Perfect study playlist: Favorite Person → I Need Her → One Love. Thank me later",
    avatar: "📚",
    tier: "fan",
  },
  {
    username: "FestivalGoer",
    content:
      "Love On The Lawn 5th Annual is going to be the biggest year yet. Lets goooo 🎉",
    avatar: "🎪",
    tier: "fan",
  },
  {
    username: "SubscribedDay1",
    content:
      "Been here since the beginning. $4.99/mo is nothing for this catalog. Worth every penny",
    avatar: "💎",
    tier: "vip",
  },
  {
    username: "MixMaster",
    content:
      "Mixed Love On The Lawn with the DJ turntables and it sounds CRAZY with Rent Due",
    avatar: "🎚️",
    tier: "fan",
  },
  {
    username: "SoulMusic",
    content:
      "Mike Page makes music that actually means something. Not just noise. SOUL.",
    avatar: "🎤",
    tier: "fan",
  },
  {
    username: "ChiTownFan",
    content:
      "Representing Chicago! Mike Page Foundation doing more for the community than most corporations",
    avatar: "🏙️",
    tier: "supporter",
  },
  {
    username: "WavyVibes",
    content:
      "I keep coming back to this app. The experience is unmatched. MyStation > everything",
    avatar: "🌊",
    tier: "fan",
  },
];

export async function GET(request) {
  try {
    // Verify cron secret — required in production
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret && process.env.NODE_ENV === "production") {
      console.error("[Cron] CRON_SECRET not set in production");
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 },
      );
    }

    // Check how many posts were added today to avoid duplicates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayPosts } = await supabase
      .from("fan_wall")
      .select("id")
      .gte("created_at", today.toISOString())
      .in("tier", ["fan", "supporter", "vip"]);

    const existingCount = todayPosts?.length || 0;
    const postsNeeded = Math.max(0, 5 - existingCount);

    if (postsNeeded === 0) {
      return NextResponse.json({
        message: "Already have 5+ posts today",
        added: 0,
      });
    }

    // Get existing usernames to avoid repeats
    const { data: existingPosts } = await supabase
      .from("fan_wall")
      .select("username")
      .order("created_at", { ascending: false })
      .limit(20);

    const recentUsernames = new Set(
      (existingPosts || []).map((p) => p.username),
    );

    // Pick random posts from pool that haven't been used recently
    const available = POST_POOL.filter((p) => !recentUsernames.has(p.username));
    const shuffled = available.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, postsNeeded);

    // Space posts throughout the day (random times in the past 24h)
    const inserted = [];
    for (const post of selected) {
      const hoursAgo = Math.floor(Math.random() * 20) + 1; // 1-20 hours ago
      const minutesAgo = Math.floor(Math.random() * 60);
      const postTime = new Date(
        Date.now() - (hoursAgo * 60 + minutesAgo) * 60 * 1000,
      );

      const { data, error } = await supabase
        .from("fan_wall")
        .insert({
          ...post,
          likes: Math.floor(Math.random() * 30) + 5, // 5-34 likes
          created_at: postTime.toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        inserted.push(data.username);
      }
    }

    return NextResponse.json({
      message: `Added ${inserted.length} seed posts`,
      added: inserted.length,
      usernames: inserted,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
