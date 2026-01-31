/**
 * MYSTATION - Root Layout
 * Premium music streaming for Mike Page Foundation
 */

import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import Player from '@/components/Player';
import AudioPlayer from '@/components/AudioPlayer';
import ClientProviders from '@/components/ClientProviders';

export const metadata = {
  metadataBase: new URL('https://mystation.vercel.app'),
  title: {
    default: 'MyStation - Mike Page Foundation',
    template: '%s | MyStation',
  },
  description: 'Stream Mike Page music for free. All donations support youth music programs through the Mike Page Foundation.',
  keywords: 'Mike Page, IDMG, hip-hop, music streaming, donation, foundation',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-mystation-darker">
        <ClientProviders>
          <Navbar />
          <main className="pt-16 pb-28">
            {children}
          </main>
          <Player />
          <AudioPlayer />
        </ClientProviders>
      </body>
    </html>
  );
}
