import type { Palette } from './index';

export const light: Palette = {
  name: 'light',
  bg: { base: '#f7f6fb', raised: '#ffffff', glass: 'rgba(255,255,255,0.7)' },
  border: { subtle: 'rgba(15,15,40,0.08)', strong: 'rgba(15,15,40,0.18)' },
  text: { primary: '#15131f', secondary: '#4a4860', muted: '#7a7890' },
  accent: {
    primary: '#7c3aed',
    secondary: '#db2777',
    gradient: 'linear-gradient(135deg, #7c3aed, #db2777)',
  },
  semantic: { positive: '#16a34a', negative: '#dc2626', warning: '#d97706', info: '#2563eb' },
  currency: { BRL: '#16a34a', USD: '#2563eb', CAD: '#dc2626' },
  shadow: {
    glass: '0 8px 24px rgba(15,15,40,0.08)',
    glow: '0 0 32px rgba(124,58,237,0.18)',
  },
};
