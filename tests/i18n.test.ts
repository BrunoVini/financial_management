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

  it('switches locale and resolves translations', () => {
    // Given: store currently in any state
    // When: switching to en and translating a known key
    setLocale('en');
    // Then: the English translation is returned
    expect(get(t)('nav.overview')).toBe('Overview');

    // And: switching back to pt-BR returns the Portuguese translation
    setLocale('pt-BR');
    expect(get(t)('nav.overview')).toBe('Visão geral');
  });

  it('returns the key when translation is missing', () => {
    // Given: a key that exists in no dictionary
    // When: t() is called
    // Then: the key itself is returned (acts as a visible fallback)
    expect(get(t)('missing.key')).toBe('missing.key');
  });

  it('detectLocale returns pt-BR for pt navigator language', () => {
    // Given: a navigator language string starting with 'pt'
    // When: detectLocale is called
    // Then: pt-BR is selected
    expect(detectLocale('pt-BR')).toBe('pt-BR');
    expect(detectLocale('pt')).toBe('pt-BR');
  });

  it('detectLocale returns en otherwise', () => {
    // Given: any non-pt navigator language
    // When: detectLocale is called
    // Then: en is the fallback
    expect(detectLocale('fr-FR')).toBe('en');
    expect(detectLocale('en-US')).toBe('en');
  });
});
