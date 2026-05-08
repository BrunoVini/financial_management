import type { Currency } from '@/lib/types';

export interface CurrencyOption {
  code: Currency;
  flag: string;
  label: string;
}

// Matches the SUPPORTED_CURRENCIES used by the onboarding wizard.
export const DEFAULT_CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'BRL', flag: '🇧🇷', label: 'Real' },
  { code: 'USD', flag: '🇺🇸', label: 'US Dollar' },
  { code: 'CAD', flag: '🇨🇦', label: 'Canadian Dollar' },
  { code: 'EUR', flag: '🇪🇺', label: 'Euro' },
];
