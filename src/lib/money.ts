import type { Currency, Language } from './types';

export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  ratesEurBase: Record<Currency, number>,
): number {
  if (from === to) return amount;
  const fromRate = ratesEurBase[from];
  const toRate = ratesEurBase[to];
  if (fromRate === undefined || toRate === undefined) return NaN;
  return (amount / fromRate) * toRate;
}

const LOCALE_BY_LANG: Record<Language, string> = {
  'pt-BR': 'pt-BR',
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
};

export function formatMoney(amount: number, currency: Currency, language: Language): string {
  return new Intl.NumberFormat(LOCALE_BY_LANG[language], {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
