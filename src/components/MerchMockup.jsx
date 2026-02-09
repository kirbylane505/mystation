/**
 * MerchMockup - Renders product mockups with logo overlay
 * Creates realistic shirt/hoodie mockups dynamically
 */

'use client';

import Image from 'next/image';

// SVG T-Shirt template
const TShirtSVG = ({ color = '#1a1a1a', className = '' }) => (
  <svg viewBox="0 0 400 450" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Main body */}
    <path
      d="M100 80 L60 100 L20 140 L40 160 L80 130 L80 420 L320 420 L320 130 L360 160 L380 140 L340 100 L300 80 L260 60 Q200 40 140 60 L100 80Z"
      fill={color}
      stroke={color === '#1a1a1a' ? '#333' : '#ddd'}
      strokeWidth="2"
    />
    {/* Collar */}
    <path
      d="M140 60 Q170 80 200 85 Q230 80 260 60"
      fill="none"
      stroke={color === '#1a1a1a' ? '#333' : '#ccc'}
      strokeWidth="3"
    />
    {/* Left sleeve seam */}
    <path
      d="M80 130 L100 80"
      stroke={color === '#1a1a1a' ? '#222' : '#ccc'}
      strokeWidth="1"
      opacity="0.5"
    />
    {/* Right sleeve seam */}
    <path
      d="M320 130 L300 80"
      stroke={color === '#1a1a1a' ? '#222' : '#ccc'}
      strokeWidth="1"
      opacity="0.5"
    />
  </svg>
);

// SVG Hoodie template
const HoodieSVG = ({ color = '#1a1a1a', className = '' }) => (
  <svg viewBox="0 0 400 480" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Main body */}
    <path
      d="M90 100 L40 120 L10 180 L35 200 L70 160 L70 450 L330 450 L330 160 L365 200 L390 180 L360 120 L310 100 L280 70 Q200 30 120 70 L90 100Z"
      fill={color}
      stroke={color === '#1a1a1a' ? '#333' : '#ddd'}
      strokeWidth="2"
    />
    {/* Hood */}
    <path
      d="M120 70 Q100 40 130 20 Q200 -10 270 20 Q300 40 280 70"
      fill={color}
      stroke={color === '#1a1a1a' ? '#333' : '#ddd'}
      strokeWidth="2"
    />
    {/* Hood inner */}
    <ellipse cx="200" cy="55" rx="50" ry="30" fill={color === '#1a1a1a' ? '#111' : '#e5e5e5'} />
    {/* Kangaroo pocket */}
    <path
      d="M120 320 Q200 340 280 320 L280 380 Q200 400 120 380 Z"
      fill={color === '#1a1a1a' ? '#151515' : '#e8e8e8'}
      stroke={color === '#1a1a1a' ? '#222' : '#ccc'}
      strokeWidth="1"
    />
    {/* Drawstrings */}
    <path d="M180 70 L175 140" stroke={color === '#1a1a1a' ? '#444' : '#aaa'} strokeWidth="2" />
    <path d="M220 70 L225 140" stroke={color === '#1a1a1a' ? '#444' : '#aaa'} strokeWidth="2" />
  </svg>
);

// SVG Cap template
const CapSVG = ({ color = '#1a1a1a', className = '' }) => (
  <svg viewBox="0 0 300 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Bill */}
    <ellipse cx="150" cy="140" rx="120" ry="25" fill={color} />
    {/* Crown */}
    <path
      d="M40 130 Q40 50 150 40 Q260 50 260 130"
      fill={color}
      stroke={color === '#1a1a1a' ? '#333' : '#ddd'}
      strokeWidth="2"
    />
    {/* Panel seams */}
    <path d="M150 40 L150 130" stroke={color === '#1a1a1a' ? '#222' : '#ccc'} strokeWidth="1" opacity="0.5" />
    <path d="M95 55 L80 130" stroke={color === '#1a1a1a' ? '#222' : '#ccc'} strokeWidth="1" opacity="0.5" />
    <path d="M205 55 L220 130" stroke={color === '#1a1a1a' ? '#222' : '#ccc'} strokeWidth="1" opacity="0.5" />
    {/* Button on top */}
    <circle cx="150" cy="42" r="6" fill={color === '#1a1a1a' ? '#333' : '#ccc'} />
  </svg>
);

// SVG Crewneck template
const CrewneckSVG = ({ color = '#1a1a1a', className = '' }) => (
  <svg viewBox="0 0 400 450" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Main body - thicker/heavier than tee */}
    <path
      d="M95 85 L50 110 L15 160 L45 185 L85 145 L85 420 L315 420 L315 145 L355 185 L385 160 L350 110 L305 85 L265 60 Q200 35 135 60 L95 85Z"
      fill={color}
      stroke={color === '#1a1a1a' ? '#333' : '#ddd'}
      strokeWidth="2"
    />
    {/* Ribbed collar */}
    <ellipse cx="200" cy="62" rx="55" ry="18" fill={color === '#1a1a1a' ? '#222' : '#ddd'} />
    <ellipse cx="200" cy="62" rx="40" ry="12" fill={color === '#1a1a1a' ? '#111' : '#ccc'} />
    {/* Ribbed cuffs indication */}
    <rect x="85" y="405" width="230" height="15" rx="3" fill={color === '#1a1a1a' ? '#222' : '#ddd'} />
  </svg>
);

// SVG Women's Leggings template
const LeggingsSVG = ({ color = '#1a1a1a', className = '' }) => (
  <svg viewBox="0 0 300 500" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Waistband */}
    <path
      d="M60 30 Q150 20 240 30 L245 55 Q150 45 55 55 Z"
      fill={color === '#1a1a1a' ? '#222' : '#e0e0e0'}
      stroke={color === '#1a1a1a' ? '#333' : '#ccc'}
      strokeWidth="1"
    />
    {/* Left leg */}
    <path
      d="M55 55 Q50 150 60 250 Q65 350 55 480 L105 485 Q120 350 115 250 Q110 150 150 55 Z"
      fill={color}
      stroke={color === '#1a1a1a' ? '#333' : '#ddd'}
      strokeWidth="2"
    />
    {/* Right leg */}
    <path
      d="M150 55 Q190 150 185 250 Q180 350 195 485 L245 480 Q235 350 240 250 Q250 150 245 55 Z"
      fill={color}
      stroke={color === '#1a1a1a' ? '#333' : '#ddd'}
      strokeWidth="2"
    />
    {/* Center seam */}
    <path
      d="M150 55 L150 180"
      stroke={color === '#1a1a1a' ? '#222' : '#bbb'}
      strokeWidth="1"
      opacity="0.6"
    />
    {/* Left leg seam */}
    <path
      d="M85 100 Q90 250 80 400"
      stroke={color === '#1a1a1a' ? '#222' : '#bbb'}
      strokeWidth="1"
      opacity="0.4"
    />
    {/* Right leg seam */}
    <path
      d="M215 100 Q210 250 220 400"
      stroke={color === '#1a1a1a' ? '#222' : '#bbb'}
      strokeWidth="1"
      opacity="0.4"
    />
  </svg>
);

const colorMap = {
  'Black': '#1a1a1a',
  'White': '#f5f5f5',
  'Navy': '#1e3a5f',
  'Charcoal': '#36454f',
  'Grey': '#6b7280',
  'Cream': '#f5f5dc',
  'Khaki': '#c3b091',
  'Red': '#dc2626',
  'Pink': '#ec4899',
  'Purple': '#8b5cf6',
  'Royal Blue': '#2563eb',
};

// Colorful gradient backgrounds for products
const gradientBgs = {
  tshirt: 'from-blue-600/30 via-purple-600/20 to-pink-600/30',
  hoodie: 'from-indigo-600/30 via-blue-600/20 to-cyan-600/30',
  cap: 'from-orange-500/30 via-red-500/20 to-pink-500/30',
  crewneck: 'from-emerald-600/30 via-teal-600/20 to-blue-600/30',
  leggings: 'from-pink-500/30 via-purple-500/20 to-fuchsia-500/30',
};

export default function MerchMockup({
  type = 'tshirt',
  color = 'Black',
  logo = '/images/mpf-logo.png',
  logoSize = 'medium',
  logoColor = 'auto',
  className = ''
}) {
  const bgColor = colorMap[color] || color;
  const isLight = ['White', 'Cream', 'Khaki', '#f5f5f5', '#f5f5dc', '#c3b091'].includes(color);

  // Logo sizes and positions per product type
  const logoConfigs = {
    tshirt: {
      small: { width: 80, height: 80, top: '35%', left: '50%' },
      medium: { width: 120, height: 120, top: '32%', left: '50%' },
      large: { width: 160, height: 160, top: '28%', left: '50%' },
    },
    hoodie: {
      small: { width: 80, height: 80, top: '38%', left: '50%' },
      medium: { width: 120, height: 120, top: '35%', left: '50%' },
      large: { width: 160, height: 160, top: '32%', left: '50%' },
    },
    cap: {
      small: { width: 100, height: 100, top: '30%', left: '50%' },
      medium: { width: 130, height: 130, top: '26%', left: '50%' },
      large: { width: 155, height: 155, top: '22%', left: '50%' },
    },
    crewneck: {
      small: { width: 80, height: 80, top: '35%', left: '50%' },
      medium: { width: 120, height: 120, top: '32%', left: '50%' },
      large: { width: 160, height: 160, top: '28%', left: '50%' },
    },
    leggings: {
      small: { width: 50, height: 50, top: '35%', left: '30%' },
      medium: { width: 70, height: 70, top: '32%', left: '28%' },
      large: { width: 90, height: 90, top: '28%', left: '26%' },
    },
  };

  const config = logoConfigs[type] || logoConfigs.tshirt;
  const size = config[logoSize] || config.medium;

  const MockupSVG = {
    tshirt: TShirtSVG,
    hoodie: HoodieSVG,
    cap: CapSVG,
    crewneck: CrewneckSVG,
    leggings: LeggingsSVG,
  }[type] || TShirtSVG;

  const gradientBg = gradientBgs[type] || gradientBgs.tshirt;

  // Determine logo filter for visibility
  const useWhiteLogo = logoColor === 'white' || (!isLight && logoColor === 'auto');

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Colorful background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientBg} rounded-xl`} />
      <div className={`absolute inset-0 ${isLight ? 'bg-white/40' : 'bg-black/30'} rounded-xl`} />

      {/* SVG Mockup */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <MockupSVG color={bgColor} className="w-full h-full max-w-[280px] drop-shadow-2xl" />

        {/* Logo overlay */}
        <div
          className="absolute flex items-center justify-center -translate-x-1/2"
          style={{ top: size.top, left: size.left }}
        >
          <div
            className="relative drop-shadow-lg"
            style={{ width: size.width, height: size.height }}
          >
            <Image
              src={logo}
              alt="Logo"
              fill
              className={`object-contain ${useWhiteLogo ? 'brightness-0 invert' : ''}`}
            />
          </div>
        </div>

        {/* Second logo for leggings (right leg) */}
        {type === 'leggings' && (
          <div
            className="absolute flex items-center justify-center"
            style={{ top: size.top, left: '72%', transform: 'translateX(-50%)' }}
          >
            <div
              className="relative drop-shadow-lg"
              style={{ width: size.width, height: size.height }}
            >
              <Image
                src={logo}
                alt="Logo"
                fill
                className={`object-contain ${useWhiteLogo ? 'brightness-0 invert' : ''}`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
