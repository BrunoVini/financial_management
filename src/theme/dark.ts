import type { Palette } from './index';

export const dark: Palette = {
  name: 'dark',
  bg: { base: '#0b0a14', raised: '#13111f', glass: 'rgba(255,255,255,0.06)' },
  border: { subtle: 'rgba(255,255,255,0.08)', strong: 'rgba(255,255,255,0.16)' },
  text: { primary: '#e7e5f0', secondary: '#a8a5b8', muted: '#6b6880' },
  accent: {
    primary: '#a855f7',
    secondary: '#ec4899',
    gradient: 'linear-gradient(135deg, #a855f7, #ec4899)',
  },
  semantic: { positive: '#4ade80', negative: '#f87171', warning: '#fbbf24', info: '#60a5fa' },
  currency: { BRL: '#22c55e', USD: '#3b82f6', CAD: '#ef4444' },
  shadow: {
    glass: '0 8px 32px rgba(0,0,0,0.4)',
    glow: '0 0 40px rgba(168,85,247,0.15)',
  },
};
