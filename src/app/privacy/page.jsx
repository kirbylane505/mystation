export const metadata = {
  title: 'Privacy Policy',
  description: 'MyStation privacy policy. How we handle your data.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0a0a1a] text-white px-6 py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-gray-400 mb-8">Last updated: March 3, 2026</p>

      <div className="space-y-8 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">What We Collect</h2>
          <p>When you subscribe to MyStation, we collect your email address to manage your account. Payment processing is handled by Stripe. We never see or store your credit card details.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">How We Use Your Data</h2>
          <p>Your email is used to verify your subscription status and send important updates about new music, events, and merch drops. We do not sell or share your personal information with third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Cookies</h2>
          <p>We use cookies to maintain your login session and subscription status. These are essential cookies required for the service to function.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Analytics</h2>
          <p>We use Sentry for error tracking and PostHog for anonymous usage analytics to improve the app experience. No personally identifiable information is shared with analytics providers.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Push Notifications</h2>
          <p>If you use the MyStation mobile app and grant notification permissions, we may send push notifications about new music releases, events, and special offers. You can disable these in your device settings at any time.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Data Retention</h2>
          <p>We retain your account data for as long as your subscription is active. You can request deletion of your data by contacting us.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
          <p>Questions about this policy? Email us at{' '}
            <a href="mailto:mystationlive@gmail.com" className="text-indigo-400 hover:underline">mystationlive@gmail.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Children</h2>
          <p>MyStation is rated 12+. We do not knowingly collect data from children under 13. If you believe we have collected data from a child, please contact us immediately.</p>
        </section>
      </div>

      <p className="mt-12 text-gray-500 text-sm">MyStation is operated by MyStation LLC (Wyoming).</p>
    </main>
  );
}
