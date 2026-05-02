import { derived, writable, get } from 'svelte/store';
import type { Store } from './types';
import { loadStore, saveStore } from './storage';
import { setLocale, locale } from '../i18n';
import { setTheme, theme } from '../theme';

const initial: Store = loadStore();

export const appStore = writable<Store>(initial);

let lastLanguage = initial.settings.language;
let lastTheme = initial.settings.theme;

appStore.subscribe((value) => {
  saveStore(value);
  if (value.settings.language !== lastLanguage) {
    setLocale(value.settings.language);
    lastLanguage = value.settings.language;
  }
  if (value.settings.theme !== lastTheme) {
    setTheme(value.settings.theme);
    lastTheme = value.settings.theme;
  }
});

// Apply initial settings to dependent stores at boot
setLocale(initial.settings.language);
setTheme(initial.settings.theme);

export type Mutator = (store: Store) => Store;

export function mutate(fn: Mutator): void {
  appStore.update(fn);
}

export const settings = derived(appStore, ($s) => $s.settings);
export const categories = derived(appStore, ($s) => $s.categories);
export const accounts = derived(appStore, ($s) => $s.accounts);
export const months = derived(appStore, ($s) => $s.months);
export const investments = derived(appStore, ($s) => $s.investments);

export { get, locale, theme };
