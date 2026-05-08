import type { Palette } from './index';

/**
 * Pastoral · Light — Soft Apothecary
 * Cream-on-cream warmth, sage as the primary accent, dusty rose for
 * emphasis. No purple gradients. Hairlines are warm, not cold.
 */
export const light: Palette = {
  name: 'light',
  bg: {
    base: '#f5efe6', // cream paper — page background
    raised: '#fdfaf3', // brighter paper — cards
    glass: '#ece4d6', // pill / inline chip background
  },
  border: {
    subtle: 'rgba(46,42,38,0.10)',
    strong: 'rgba(46,42,38,0.22)',
  },
  text: {
    primary: '#2e2a26', // warm dark ink
    secondary: '#5e564d',
    muted: '#8e8378',
  },
  accent: {
    primary: '#5a7158', // sage-deep — buttons, focus, primary actions
    secondary: '#b4837a', // rose-deep — headings underline, emphasis
    gradient: 'linear-gradient(135deg, #7c9474 0%, #b4837a 100%)',
  },
  semantic: {
    positive: '#5a7158', // sage — gains, income
    negative: '#b4837a', // dusty rose — losses, expenses (warmer than red)
    warning: '#a87a3a', // honey-deep
    info: '#7991a8', // dusty blue
  },
  currency: {
    BRL: '#5a7158',
    USD: '#7991a8',
    CAD: '#b4837a',
    EUR: '#a87a3a',
  },
  shadow: {
    glass: '0 4px 14px rgba(46,42,38,0.06), 0 1px 0 rgba(255,255,255,0.7) inset',
    glow: '0 6px 22px rgba(124,148,116,0.18)',
  },
};
