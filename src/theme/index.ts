import { writable, get } from 'svelte/store';
import { dark } from './dark';
import { light } from './light';
import type { ThemeName } from '../lib/types';

export interface Palette {
  name: ThemeName;
  bg: { base: string; raised: string; glass: string };
  border: { subtle: string; strong: string };
  text: { primary: string; secondary: string; muted: string };
  accent: { primary: string; secondary: string; gradient: string };
  semantic: { positive: string; negative: string; warning: string; info: string };
  currency: Record<string, string>;
  shadow: { glass: string; glow: string };
}

const PALETTES: Record<ThemeName, Palette> = { dark, light };

export const theme = writable<Palette>(PALETTES.dark);

export function setTheme(name: ThemeName): void {
  theme.set(PALETTES[name]);
}

export function applyThemeToDocument(palette: Palette): void {
  const root = document.documentElement;
  root.style.setProperty('--bg-base', palette.bg.base);
  root.style.setProperty('--bg-raised', palette.bg.raised);
  root.style.setProperty('--bg-glass', palette.bg.glass);
  root.style.setProperty('--border-subtle', palette.border.subtle);
  root.style.setProperty('--border-strong', palette.border.strong);
  root.style.setProperty('--text-primary', palette.text.primary);
  root.style.setProperty('--text-secondary', palette.text.secondary);
  root.style.setProperty('--text-muted', palette.text.muted);
  root.style.setProperty('--accent-primary', palette.accent.primary);
  root.style.setProperty('--accent-secondary', palette.accent.secondary);
  root.style.setProperty('--accent-gradient', palette.accent.gradient);
  root.style.setProperty('--positive', palette.semantic.positive);
  root.style.setProperty('--negative', palette.semantic.negative);
  root.style.setProperty('--warning', palette.semantic.warning);
  root.style.setProperty('--info', palette.semantic.info);
  root.style.setProperty('--shadow-glass', palette.shadow.glass);
  root.style.setProperty('--shadow-glow', palette.shadow.glow);
  root.dataset.theme = palette.name;
}

export { get };
