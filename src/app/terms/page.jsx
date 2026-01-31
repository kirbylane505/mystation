/**
 * MYSTATION - Terms of Service
 */

export const metadata = {
  title: 'Terms of Service | MyStation',
  description: 'Terms of Service for MyStation music streaming platform',
};

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] pt-24 pb-32">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-white/40 mb-8">Last updated: January 31, 2026</p>

        <div className="prose prose-invert prose-lg">
          <div className="space-y-8 text-white/70">

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using MyStation (mystation.vercel.app), operated by Impossible Dreamz
                Music Group (IDMG), you agree to be bound by these Terms of Service. If you do not
                agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
              <p>
                MyStation is a music streaming platform that provides access to music by Mike Page
                and affiliated artists. The service includes:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Music streaming and playback</li>
                <li>Artist information and updates</li>
                <li>Donation processing (via CashApp)</li>
                <li>Community features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. User Conduct</h2>
              <p>You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Download, copy, or redistribute music without permission</li>
                <li>Circumvent any security measures or access restrictions</li>
                <li>Use automated tools to access the service</li>
                <li>Post harmful, offensive, or illegal content</li>
                <li>Impersonate others or misrepresent your identity</li>
                <li>Use the service for any illegal purpose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Intellectual Property</h2>
              <p>
                All music, artwork, logos, and content on MyStation are owned by Mike Page,
                Impossible Dreamz Music Group, or their respective licensors. All rights reserved.
              </p>
              <p className="mt-3">
                You may not reproduce, distribute, modify, or create derivative works from any
                content without explicit written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Donations</h2>
              <p>
                Donations made through MyStation are processed via CashApp and are:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Non-refundable</strong> once processed</li>
                <li><strong>Voluntary</strong> and not required for access</li>
                <li>Subject to CashApp's terms of service</li>
              </ul>
              <p className="mt-3">
                Donations to the Mike Page Foundation (501(c)(3)) may be tax-deductible.
                Consult a tax professional for advice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Disclaimer of Warranties</h2>
              <p>
                MyStation is provided "AS IS" without warranties of any kind. We do not guarantee:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Uninterrupted or error-free service</li>
                <li>Accuracy or completeness of content</li>
                <li>That the service will meet your expectations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, IDMG and its affiliates shall not be
                liable for any indirect, incidental, special, or consequential damages arising
                from your use of MyStation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Changes to Terms</h2>
              <p>
                We may update these Terms at any time. Continued use of MyStation after changes
                constitutes acceptance of the new terms. We encourage you to review this page
                periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Termination</h2>
              <p>
                We reserve the right to terminate or suspend access to MyStation at any time,
                without notice, for conduct that we believe violates these Terms or is harmful
                to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Governing Law</h2>
              <p>
                These Terms shall be governed by the laws of the State of Georgia, USA,
                without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Contact</h2>
              <p>
                For questions about these Terms, contact us at:
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
