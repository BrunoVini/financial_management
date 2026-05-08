import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { locale, setLocale, t, detectLocale } from '@/i18n/index';

describe('i18n', () => {
  it('defaults to pt-BR', () => {
    // Given: a fresh import of the locale store
    // When: reading current value
    // Then: pt-BR is the default
    expect(get(locale)).toBe('pt-BR');
  });

  it('switches locale and resolves translations across all 4 supported languages', () => {
    // Given: store in any state
    // When/Then: switching to each supported locale resolves nav.overview
    setLocale('en');
    expect(get(t)('nav.overview')).toBe('Overview');

    setLocale('pt-BR');
    expect(get(t)('nav.overview')).toBe('Visão geral');

    setLocale('fr');
    expect(get(t)('nav.overview')).toBe("Vue d'ensemble");

    setLocale('es');
    expect(get(t)('nav.overview')).toBe('Resumen');
  });

  it('returns the key when translation is missing', () => {
    // Given: a key that exists in no dictionary
    // When: t() is called
    // Then: the key itself is returned (acts as a visible fallback)
    expect(get(t)('missing.key')).toBe('missing.key');
  });

  it('detectLocale picks pt-BR / fr / es from navigator language prefixes', () => {
    // Given: navigator language strings with common prefixes
    // When/Then: each one maps to the matching supported locale
    expect(detectLocale('pt-BR')).toBe('pt-BR');
    expect(detectLocale('pt')).toBe('pt-BR');
    expect(detectLocale('fr-FR')).toBe('fr');
    expect(detectLocale('fr')).toBe('fr');
    expect(detectLocale('es-MX')).toBe('es');
    expect(detectLocale('es')).toBe('es');
  });

  it('detectLocale returns en for everything else', () => {
    // Given: a navigator language that does not start with pt/fr/es
    // When/Then: en is the fallback
    expect(detectLocale('en-US')).toBe('en');
    expect(detectLocale('de-DE')).toBe('en');
    expect(detectLocale('ja')).toBe('en');
  });
});
