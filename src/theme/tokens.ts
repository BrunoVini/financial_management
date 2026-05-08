export const tokens = {
  spacing: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '24px', 6: '32px', 7: '48px' },
  // Pastoral favors generous rounding — radius bumped across the board.
  radius: { sm: '6px', md: '10px', lg: '16px', xl: '22px', xxl: '28px', pill: '999px' },
  type: {
    // Display = serif with optical-size axis (headings, big numbers, accents).
    // Body = humanist sans (warm, friendly, very readable at small sizes).
    display:
      "'Fraunces', 'Iowan Old Style', 'Apple Garamond', 'Hoefler Text', Georgia, ui-serif, serif",
    body: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Segoe UI Symbol'",
    // `family` kept as legacy alias = body (existing call sites continue to work).
    family: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Segoe UI Symbol'",
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
