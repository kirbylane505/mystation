import Link from "next/link";

export const metadata = {
  title: "MyStation is Free",
  description:
    "MyStation is now free for everyone — no premium tier needed. Support your favorite artists directly on any song page.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://mystationlive.com/premium" },
};

export default function PremiumPage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 pt-24 pb-16 bg-gradient-to-b from-mystation-navy to-black text-white">
      <div className="max-w-2xl w-full text-center">
        <p className="text-blue-400 uppercase tracking-widest text-xs font-bold mb-4">
          PWYW · Pay What You Want
        </p>
        <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
          Premium is now the <span className="text-blue-400">default</span>.
        </h1>
        <p className="text-lg text-gray-300 mb-8 leading-relaxed">
          Every song is full-length. The Vault is open. Search is free. No
          paywall. If you love the music, you can support the artist directly on
          any song page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link
            href="/music"
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-blue-500/30 transition"
          >
            Explore the Catalog
          </Link>
          <Link
            href="/vault"
            className="px-8 py-3 bg-white/10 border border-white/20 rounded-xl font-bold text-white hover:bg-white/20 transition"
          >
            Enter the Vault
          </Link>
        </div>
        <p className="text-sm text-gray-400 border-t border-white/10 pt-6">
          Already on a premium plan? You&apos;re a{" "}
          <span className="text-blue-400 font-semibold">
            Founding Supporter
          </span>{" "}
          forever. Manage in{" "}
          <Link href="/account" className="underline hover:text-white">
            your account
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
