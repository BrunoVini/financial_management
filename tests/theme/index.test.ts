import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { theme, setTheme, applyThemeToDocument, type Palette } from '@/theme/index';

describe('theme', () => {
  it('starts in dark mode by default', () => {
    // Given: a fresh import of the theme store
    // When: reading the current value
    // Then: the default palette is the dark one
    expect(get(theme).name).toBe('dark');
  });

  it('switches to light when setTheme is called', () => {
    // Given: store currently in any state
    // When: setTheme('light') is called
    setTheme('light');
    // Then: the active palette becomes the light one
    expect(get(theme).name).toBe('light');
  });

  it('exposes palette structure for both themes', () => {
    // Given: switching back to dark
    setTheme('dark');

    // When: reading the palette
    const dark: Palette = get(theme);

    // Then: required colour groups are present (smoke check on shape)
    expect(dark.bg.base).toBeTruthy();
    expect(dark.accent.primary).toBeTruthy();
  });

  it('applies palette to document as CSS custom properties', () => {
    // Given: the dark palette is active
    setTheme('dark');

    // When: applyThemeToDocument is invoked
    applyThemeToDocument(get(theme));

    // Then: CSS custom properties are set on <html>
    const value = document.documentElement.style.getPropertyValue('--bg-base');
    expect(value).toBeTruthy();
  });
});
