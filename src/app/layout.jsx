/**
 * MYSTATION - Root Layout
 */

import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import Player from '@/components/Player';

export const metadata = {
  title: 'MyStation - Mike Page Foundation',
  description: 'Stream Mike Page music for free. All donations support youth music programs through the Mike Page Foundation.',
  keywords: 'Mike Page, IDMG, hip-hop, music streaming, donation, foundation',
  openGraph: {
    title: 'MyStation - Mike Page Foundation',
    description: 'Free music streaming with 100% of donations going to youth programs.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-mystation-darker">
        <Navbar />
        <main className="pt-16 pb-28">
          {children}
        </main>
        <Player />
      </body>
    </html>
  );
}
