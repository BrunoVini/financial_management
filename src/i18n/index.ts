import { derived, writable, get } from 'svelte/store';
import type { Language } from '../lib/types';
import { ptBr } from './pt-br';
import { en } from './en';

const DICTS: Record<Language, Record<string, string>> = { 'pt-BR': ptBr, en };

export const locale = writable<Language>('pt-BR');

export function setLocale(next: Language): void {
  locale.set(next);
}

export const t = derived(locale, ($locale) => {
  const dict = DICTS[$locale];
  return (key: string): string => dict[key] ?? key;
});

export function detectLocale(navLanguage: string): Language {
  return navLanguage.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
}

export { get };
