import type { Palette } from './index';

/**
 * Pastoral · Dark — Warm Coffee Night
 * Not literal black. A coffee/dark-wood base with cream text. Sage and
 * rose are slightly lifted for contrast on dark; honey carries warmth.
 */
export const dark: Palette = {
  name: 'dark',
  bg: {
    base: '#1f1a14', // warm dark coffee — page background
    raised: '#2a2319', // raised wood — cards
    glass: 'rgba(245,239,230,0.06)', // cream-tinted glass for pills
  },
  border: {
    subtle: 'rgba(245,239,230,0.10)',
    strong: 'rgba(245,239,230,0.22)',
  },
  text: {
    primary: '#f5efe6', // cream paper as text on dark
    secondary: 'rgba(245,239,230,0.72)',
    muted: 'rgba(245,239,230,0.46)',
  },
  accent: {
    primary: '#9cb594', // sage lifted for dark — primary actions
    secondary: '#e0bfb7', // dusty rose lifted — emphasis
    gradient: 'linear-gradient(135deg, #9cb594 0%, #e0bfb7 100%)',
  },
  semantic: {
    positive: '#9cb594', // sage
    negative: '#e0bfb7', // dusty rose (gentle, not alarming red)
    warning: '#e0b66e', // honey
    info: '#a8c0d6', // dusty cream-blue
  },
  currency: {
    BRL: '#9cb594',
    USD: '#a8c0d6',
    CAD: '#e0bfb7',
    EUR: '#e0b66e',
  },
  shadow: {
    glass: '0 6px 20px rgba(0,0,0,0.32), 0 1px 0 rgba(245,239,230,0.04) inset',
    glow: '0 8px 28px rgba(156,181,148,0.18)',
  },
};
