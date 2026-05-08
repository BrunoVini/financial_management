import { derived, writable, get } from 'svelte/store';
import type { Language } from '../lib/types';
import { ptBr } from './pt-br';
import { en } from './en';
import { fr } from './fr';
import { es } from './es';

const DICTS: Record<Language, Record<string, string>> = {
  'pt-BR': ptBr,
  en,
  fr,
  es,
};

export const SUPPORTED_LANGUAGES: Language[] = ['pt-BR', 'en', 'fr', 'es'];

export const locale = writable<Language>('pt-BR');

export function setLocale(next: Language): void {
  locale.set(next);
}

export const t = derived(locale, ($locale) => {
  const dict = DICTS[$locale];
  return (key: string): string => dict[key] ?? key;
});

export function detectLocale(navLanguage: string): Language {
  const lower = navLanguage.toLowerCase();
  if (lower.startsWith('pt')) return 'pt-BR';
  if (lower.startsWith('fr')) return 'fr';
  if (lower.startsWith('es')) return 'es';
  return 'en';
}

export { get };
