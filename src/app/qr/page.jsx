/**
 * MYSTATION - QR Code Flyers
 * Printable QR codes for physical marketing
 */

import { QrCode, Music, ShoppingBag, Ticket, Heart } from 'lucide-react';

export const metadata = {
  title: 'QR Codes - Print & Share',
  description: 'Printable QR codes for MyStation. Use at events, shows, and LOTL.',
};

const qrCodes = [
  {
    label: 'MyStation Home',
    url: 'https://mystationlive.com',
    description: 'Stream free music',
    color: 'blue',
    icon: 'Music',
  },
  {
    label: 'Merch Store',
    url: 'https://mystationlive.com/merch',
    description: 'Shop official merch',
    color: 'orange',
    icon: 'ShoppingBag',
  },
  {
    label: 'LOTL 2026',
    url: 'https://mystationlive.com/lotl',
    description: 'Festival info & tickets',
    color: 'pink',
    icon: 'Ticket',
  },
  {
    label: 'Foundation',
    url: 'https://mystationlive.com/about',
    description: 'Mike Page Foundation',
    color: 'green',
    icon: 'Heart',
  },
];

function QRCard({ label, url, description, color }) {
  // Use Google Charts API for QR code generation
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&bgcolor=0a0f1e&color=ffffff`;

  const colorStyles = {
    blue: 'from-blue-500 to-indigo-600',
    orange: 'from-orange-500 to-pink-500',
    pink: 'from-pink-500 to-purple-500',
    green: 'from-green-500 to-emerald-600',
  };

  return (
    <div className="glass rounded-2xl border border-white/10 p-6 text-center print:border print:border-gray-300 print:bg-white">
      <div className={`inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r ${colorStyles[color]} rounded-full mb-4`}>
        <span className="text-white text-xs font-bold uppercase">{label}</span>
      </div>

      <div className="bg-white rounded-xl p-4 mb-4 inline-block">
        <img
          src={qrUrl}
          alt={`QR Code for ${label}`}
          width={200}
          height={200}
          className="w-48 h-48"
        />
      </div>

      <p className="text-white font-bold mb-1 print:text-black">{label}</p>
      <p className="text-white/50 text-sm mb-2 print:text-gray-600">{description}</p>
      <p className="text-blue-400 text-xs font-mono print:text-blue-600">{url.replace('https://', '')}</p>
    </div>
  );
}

export default function QRPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-screen-xl mx-auto px-6 py-10">
        <div className="text-center mb-10 print:mb-6">
          <h1 className="text-4xl font-black text-white mb-3 print:text-black">QR Codes</h1>
          <p className="text-white/50 mb-4 print:text-gray-600">Print these and use them at events, shows, flyers, and LOTL.</p>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition print:hidden"
          >
            Print All QR Codes
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {qrCodes.map((qr) => (
            <QRCard key={qr.label} {...qr} />
          ))}
        </div>

        <div className="mt-10 text-center print:hidden">
          <p className="text-white/30 text-sm">Tip: Right-click any QR code image to save it individually.</p>
        </div>
      </div>
    </div>
  );
}
