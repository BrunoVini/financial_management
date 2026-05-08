import { describe, expect, it } from 'vitest';
import { en } from '@/i18n/en';
import { ptBr } from '@/i18n/pt-br';
import { fr } from '@/i18n/fr';
import { es } from '@/i18n/es';

const enKeys = Object.keys(en).sort();

function missingKeys(dict: Record<string, string>): string[] {
  const have = new Set(Object.keys(dict));
  return enKeys.filter((k) => !have.has(k));
}

function extraKeys(dict: Record<string, string>): string[] {
  const enSet = new Set(enKeys);
  return Object.keys(dict).filter((k) => !enSet.has(k));
}

describe('i18n parity', () => {
  it('every English key has a translation in pt-BR / fr / es', () => {
    // Given: the English dictionary as the canonical key set
    // When/Then: each non-EN dictionary covers every key
    expect({ pt: missingKeys(ptBr), fr: missingKeys(fr), es: missingKeys(es) }).toEqual({
      pt: [],
      fr: [],
      es: [],
    });
  });

  it('non-English dictionaries do not introduce stray keys', () => {
    // Given: the English dictionary as the canonical key set
    // When/Then: each non-EN dictionary contains only known keys
    expect({ pt: extraKeys(ptBr), fr: extraKeys(fr), es: extraKeys(es) }).toEqual({
      pt: [],
      fr: [],
      es: [],
    });
  });

  it('reset confirm placeholders match each language’s confirm word', () => {
    // Given: the localized "danger zone" reset flow expects a specific verb
    // When/Then: each dictionary surfaces the same word it asks the user to type
    expect(ptBr['settings.reset.confirm.placeholder']).toBe('EXCLUIR');
    expect(en['settings.reset.confirm.placeholder']).toBe('ERASE');
    expect(fr['settings.reset.confirm.placeholder']).toBe('SUPPRIMER');
    expect(es['settings.reset.confirm.placeholder']).toBe('BORRAR');
  });
});
