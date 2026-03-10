/**
 * MYSTATION — Auto-Generated Avatar
 * Generates unique avatars from user_id + display_name
 */

'use client';

const PALETTE = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
];

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getColors(seed) {
  const h = hashCode(seed);
  return [PALETTE[h % PALETTE.length], PALETTE[(h * 7) % PALETTE.length]];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function AutoAvatar({
  userId = '',
  displayName = '',
  avatarUrl = '',
  style = 'initials',
  size = 80,
  tierBorder = '',
  className = '',
}) {
  if (avatarUrl) {
    return (
      <div
        className={`rounded-full overflow-hidden shrink-0 ${tierBorder} ${className}`}
        style={{ width: size, height: size, borderWidth: tierBorder ? 3 : 0 }}
      >
        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
      </div>
    );
  }

  const seed = userId || displayName || 'default';
  const [c1, c2] = getColors(seed);
  const initials = getInitials(displayName);

  const svgContent = (() => {
    switch (style) {
      case 'geometric': {
        const h = hashCode(seed);
        const shapes = [];
        for (let i = 0; i < 4; i++) {
          const x = (h * (i + 1) * 13) % 80;
          const y = (h * (i + 1) * 17) % 80;
          const r = 10 + ((h * (i + 1)) % 20);
          shapes.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 === 0 ? c1 : c2}" opacity="0.7"/>`);
        }
        return `<rect width="80" height="80" fill="${c1}" opacity="0.3"/>${shapes.join('')}`;
      }
      case 'gradient':
        return `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="80" height="80" fill="url(#g)"/>`;
      case 'rings':
        return `<rect width="80" height="80" fill="#1e293b"/><circle cx="40" cy="40" r="35" fill="none" stroke="${c1}" stroke-width="3"/><circle cx="40" cy="40" r="25" fill="none" stroke="${c2}" stroke-width="3"/><circle cx="40" cy="40" r="15" fill="${c1}" opacity="0.5"/>`;
      case 'dots': {
        const h = hashCode(seed);
        const dots = [];
        for (let i = 0; i < 9; i++) {
          const x = 15 + (i % 3) * 25;
          const y = 15 + Math.floor(i / 3) * 25;
          const on = (h >> i) & 1;
          dots.push(`<circle cx="${x}" cy="${y}" r="8" fill="${on ? c1 : c2}" opacity="${on ? 0.9 : 0.3}"/>`);
        }
        return `<rect width="80" height="80" fill="#1e293b"/>${dots.join('')}`;
      }
      case 'waves':
        return `<rect width="80" height="80" fill="${c1}" opacity="0.3"/><path d="M0,40 Q20,20 40,40 Q60,60 80,40" stroke="${c1}" stroke-width="4" fill="none"/><path d="M0,55 Q20,35 40,55 Q60,75 80,55" stroke="${c2}" stroke-width="3" fill="none"/>`;
      case 'blocks': {
        const h = hashCode(seed);
        const blocks = [];
        for (let i = 0; i < 16; i++) {
          const x = (i % 4) * 20;
          const y = Math.floor(i / 4) * 20;
          const on = (h >> i) & 1;
          blocks.push(`<rect x="${x}" y="${y}" width="20" height="20" fill="${on ? c1 : c2}" opacity="${on ? 0.8 : 0.2}"/>`);
        }
        return blocks.join('');
      }
      case 'diamond':
        return `<rect width="80" height="80" fill="#1e293b"/><polygon points="40,5 75,40 40,75 5,40" fill="${c1}" opacity="0.7"/><polygon points="40,15 65,40 40,65 15,40" fill="${c2}" opacity="0.5"/>`;
      default:
        return `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="80" height="80" rx="40" fill="url(#g)"/><text x="40" y="40" text-anchor="middle" dominant-baseline="central" font-family="system-ui" font-weight="700" font-size="28" fill="white">${initials}</text>`;
    }
  })();

  const svgDataUrl = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">${svgContent}</svg>`)}`;

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 ${tierBorder} ${className}`}
      style={{ width: size, height: size, borderWidth: tierBorder ? 3 : 0 }}
    >
      <img src={svgDataUrl} alt={displayName} className="w-full h-full" />
    </div>
  );
}
