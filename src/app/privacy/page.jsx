/**
 * MYSTATION - Privacy Policy
 */

export const metadata = {
  title: 'Privacy Policy | MyStation',
  description: 'Privacy Policy for MyStation music streaming platform',
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] pt-24 pb-32">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-white/40 mb-8">Last updated: January 31, 2026</p>

        <div className="prose prose-invert prose-lg">
          <div className="space-y-8 text-white/70">

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p>
                MyStation ("we," "our," or "us") is operated by Impossible Dreamz Music Group (IDMG).
                This Privacy Policy explains how we collect, use, and protect your information when
                you use our music streaming platform at mystation.vercel.app.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Automatically Collected</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Device type (mobile, desktop, tablet)</li>
                <li>Browser type and version</li>
                <li>General location (city/region, not precise)</li>
                <li>Pages visited and time spent</li>
                <li>Songs played and listening history</li>
                <li>Anonymous listener ID (stored locally on your device)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Voluntarily Provided</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Comments and messages you post</li>
                <li>Email address (if you subscribe to updates)</li>
                <li>Username (if you create an account)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide and improve our music streaming service</li>
                <li>To track play counts and listening statistics</li>
                <li>To personalize your experience</li>
                <li>To display leaderboards and top listeners</li>
                <li>To communicate updates about new music</li>
                <li>To process donations (via CashApp - see their privacy policy)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Data Sharing</h2>
              <p>We do NOT sell your personal information. We may share data with:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Analytics providers</strong> - To understand how our service is used</li>
                <li><strong>Payment processors</strong> - CashApp handles donations directly</li>
                <li><strong>Legal requirements</strong> - If required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Cookies & Local Storage</h2>
              <p>
                We use local storage to save your listener ID and preferences. This helps us
                track your listening history and provide a personalized experience. You can
                clear this data by clearing your browser's local storage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Request access to your data</li>
                <li>Request deletion of your data</li>
                <li>Opt out of analytics tracking</li>
                <li>Unsubscribe from communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Data Security</h2>
              <p>
                We implement reasonable security measures to protect your information.
                However, no internet transmission is 100% secure. We encourage you to
                use strong passwords and protect your devices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Children's Privacy</h2>
              <p>
                MyStation is not intended for children under 13. We do not knowingly
                collect information from children under 13. If you believe we have
                collected such information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you
                of significant changes by posting a notice on our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
              <p>
                For privacy-related questions, contact us at:
              </p>
              <p className="mt-3">
                <strong className="text-white">Impossible Dreamz Music Group</strong><br />
                Email: idmgatl@gmail.com<br />
                Atlanta, GA
              </p>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
