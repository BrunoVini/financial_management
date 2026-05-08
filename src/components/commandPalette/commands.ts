import { push } from 'svelte-spa-router';
import {
  LayoutDashboard,
  Calendar,
  TrendingUp,
  Settings as Cog,
  UserPlus,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Wallet,
  CreditCard,
  Sun,
  Moon,
  Languages,
} from 'lucide-svelte';
import { mutate } from '@/lib/appStore';
import { openTransactionModal, type TransactionModalKind } from '@/lib/uiStore';
import { setLocale, SUPPORTED_LANGUAGES } from '@/i18n';
import { setTheme, applyThemeToDocument } from '@/theme';
import type { Settings } from '@/lib/types';
import type { Palette } from '@/theme';

// Lucide v1 ships components whose types don't match Svelte 5's Component
// runtime type cleanly, so we keep the icon field loosely typed.
export interface Cmd {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  run: () => void;
}

function tx(kind: Exclude<TransactionModalKind, null>) {
  return () => openTransactionModal(kind);
}

const LANG_LABELS: Record<string, string> = {
  'pt-BR': 'Português',
  en: 'English',
  fr: 'Français',
  es: 'Español',
};

function nextLanguage(current: Settings['language']): Settings['language'] {
  const i = SUPPORTED_LANGUAGES.indexOf(current);
  return SUPPORTED_LANGUAGES[(i + 1) % SUPPORTED_LANGUAGES.length];
}

function flipLanguage(settings: Settings) {
  const next = nextLanguage(settings.language);
  mutate((s) => ({ ...s, settings: { ...s.settings, language: next } }));
  setLocale(next);
}

function flipTheme(settings: Settings, palette: Palette) {
  const next = settings.theme === 'dark' ? 'light' : 'dark';
  mutate((s) => ({ ...s, settings: { ...s.settings, theme: next } }));
  setTheme(next);
  // Re-apply (palette here is the *current* one; setTheme just switched
  // the store, so the next $effect tick will re-run applyThemeToDocument).
  applyThemeToDocument(palette);
}

interface T {
  (key: string): string;
}

export function buildCommands(t: T, settings: Settings, palette: Palette): Cmd[] {
  return [
    { id: 'nav-overview', label: t('nav.overview'), icon: LayoutDashboard, run: () => push('/') },
    { id: 'nav-months', label: t('nav.months'), icon: Calendar, run: () => push('/months') },
    {
      id: 'nav-investments',
      label: t('nav.investments'),
      icon: TrendingUp,
      run: () => push('/investments'),
    },
    {
      id: 'nav-settings',
      label: t('nav.settings'),
      icon: Cog,
      run: () => push('/settings'),
    },
    {
      id: 'nav-onboarding',
      label: t('onboarding.welcome.title'),
      icon: UserPlus,
      run: () => push('/onboarding'),
    },
    { id: 'tx-expense', label: t('tx.fab.expense'), icon: ArrowDownCircle, run: tx('expense') },
    { id: 'tx-income', label: t('tx.fab.income'), icon: ArrowUpCircle, run: tx('income') },
    { id: 'tx-fx', label: t('tx.fab.fx'), icon: ArrowLeftRight, run: tx('fx') },
    { id: 'tx-salary', label: t('tx.fab.salary'), icon: Wallet, run: tx('salary') },
    {
      id: 'tx-installment',
      label: t('tx.fab.installment'),
      icon: CreditCard,
      run: tx('installment'),
    },
    {
      id: 'cfg-theme',
      label: `${t('settings.theme')}: ${
        settings.theme === 'dark' ? t('settings.theme.light') : t('settings.theme.dark')
      }`,
      icon: settings.theme === 'dark' ? Sun : Moon,
      run: () => flipTheme(settings, palette),
    },
    {
      id: 'cfg-lang',
      label: `${t('settings.language')}: ${LANG_LABELS[nextLanguage(settings.language)]}`,
      icon: Languages,
      run: () => flipLanguage(settings),
    },
  ];
}
