export const tokens = {
  spacing: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '24px', 6: '32px', 7: '48px' },
  radius: { sm: '4px', md: '8px', lg: '12px', xl: '16px', xxl: '24px', pill: '999px' },
  type: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif',
    size: {
      xs: 'clamp(0.72rem, 0.7rem + 0.1vw, 0.78rem)',
      sm: 'clamp(0.82rem, 0.8rem + 0.1vw, 0.9rem)',
      md: 'clamp(0.95rem, 0.92rem + 0.15vw, 1.05rem)',
      lg: 'clamp(1.15rem, 1.1rem + 0.25vw, 1.3rem)',
      xl: 'clamp(1.5rem, 1.4rem + 0.5vw, 1.85rem)',
      xxl: 'clamp(2rem, 1.8rem + 1vw, 2.6rem)',
    },
    weight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
  motion: { fast: '120ms', base: '200ms', slow: '320ms' },
  z: { nav: 10, modal: 50, toast: 60 },
} as const;

export type Tokens = typeof tokens;
