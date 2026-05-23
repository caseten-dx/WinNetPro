// Inline SVG icons used across the WinNetPro renderer. Lifted from the design
// hand-off's icons.jsx; stroke 1.5, currentColor, 24×24 viewBox by default.
// Phase E1 uses: shieldSmall, ethernet, usb, wifi, refresh, arrowRight, sun,
// moon, appGlyph, calendar. Later phases will use the rest.

import type { ReactNode } from 'react';

interface IconProps {
  size?: number;
  stroke?: number;
}

function Svg({ children, size = 16, stroke = 1.5 }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const Icons = {
  refresh: (p: IconProps = {}) => (
    <Svg {...p}><path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" /></Svg>
  ),
  ethernet: (p: IconProps = {}) => (
    <Svg {...p}>
      <rect x="3" y="9" width="18" height="11" rx="2" />
      <path d="M7 13v3M10 13v3M14 13v3M17 13v3M8 9V6m4 3V4m4 5V6" />
    </Svg>
  ),
  wifi: (p: IconProps = {}) => (
    <Svg {...p}>
      <path d="M5 12.5a10 10 0 0 1 14 0" />
      <path d="M8.5 16a5.5 5.5 0 0 1 7 0" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </Svg>
  ),
  usb: (p: IconProps = {}) => (
    <Svg {...p}>
      <path d="M12 21V4" />
      <circle cx="12" cy="3" r="1.2" fill="currentColor" />
      <path d="M12 15l-4-2.5V9" />
      <path d="M8 9h-2v-2h4v2H8z" />
      <path d="M12 12l4-2v-1l1.5-1.5L19 10l-1.5 1.5L16 10l-4 2z" />
    </Svg>
  ),
  shieldSmall: (p: IconProps = {}) => (
    <Svg {...p} size={p.size ?? 12} stroke={2}>
      <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </Svg>
  ),
  arrowRight: (p: IconProps = {}) => (
    <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
  ),
  sun: (p: IconProps = {}) => (
    <Svg {...p} size={p.size ?? 12} stroke={2}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </Svg>
  ),
  moon: (p: IconProps = {}) => (
    <Svg {...p} size={p.size ?? 12} stroke={2}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </Svg>
  ),
  // Title-bar app glyph — a tiny menu/hamburger that sits in the gradient tile.
  appGlyph: (p: IconProps = {}) => (
    <Svg {...p} size={p.size ?? 10} stroke={2.5}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </Svg>
  ),
  // Caption-button glyphs (10×10 viewBox per Win11 convention).
  capMin: () => (
    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M0 5 H10" />
    </svg>
  ),
  capMax: () => (
    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="0.5" y="0.5" width="9" height="9" />
    </svg>
  ),
  capClose: () => (
    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M0 0 L10 10 M10 0 L0 10" />
    </svg>
  ),
  // First-launch empty-state icon (28×28, server-rack-ish).
  emptyAdapter: (p: IconProps = {}) => (
    <Svg {...p} size={p.size ?? 28}>
      <rect x="3" y="9" width="18" height="11" rx="2" />
      <path d="M7 13v3M10 13v3M14 13v3M17 13v3M8 9V6m4 3V4m4 5V6" />
    </Svg>
  ),
};

// Map an adapter description/alias to an icon. The fake-provider fixture is
// labeled with "Ethernet", "USB", "Wi-Fi" descriptions which we sniff for.
export function pickAdapterIcon(description: string): keyof typeof Icons {
  const d = description.toLowerCase();
  if (d.includes('wi-fi') || d.includes('wifi') || d.includes('wireless')) return 'wifi';
  if (d.includes('usb')) return 'usb';
  return 'ethernet';
}
