import dynamic from "next/dynamic";

export const metadata = {
  title: "Help & FAQ | MyStation",
  description:
    "Frequently asked questions about MyStation subscriptions, music, merch orders, and account access.",
  openGraph: {
    title: "Help & FAQ | MyStation",
    description: "Get answers to common questions about MyStation.",
    url: "https://mystationlive.com/faq",
  },
};

// framer-motion-heavy FAQ content loaded on demand. Keeps /faq First Load JS
// down to shared baseline instead of pulling framer-motion into the page bundle.
const FAQContent = dynamic(() => import("./faq-content"), {
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center text-white/60">
      Loading FAQs...
    </div>
  ),
});

export default function FAQPage() {
  return <FAQContent />;
}
