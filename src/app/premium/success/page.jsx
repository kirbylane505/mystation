import Link from 'next/link';

export default function PremiumSuccessPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-white text-center">
      <div className="text-6xl mb-6">🏆</div>
      <h1 className="text-4xl font-black mb-4">Welcome to Premium</h1>
      <p className="text-xl text-white/80 mb-10">
        Your Supporter badge is live. Thank you for keeping the station alive.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="px-8 py-3 bg-yellow-400 text-black rounded-full font-black hover:bg-yellow-300 transition"
        >
          Start Listening
        </Link>
        <Link
          href="/account"
          className="px-8 py-3 bg-neutral-800 text-white rounded-full font-bold hover:bg-neutral-700 transition"
        >
          My Account
        </Link>
      </div>
    </main>
  );
}
