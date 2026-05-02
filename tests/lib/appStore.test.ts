import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { ROOT_KEY, defaultStore, saveStore } from '@/lib/storage';

async function loadFreshAppStore() {
  // appStore captures localStorage state at module-evaluation time.
  // resetModules() forces re-evaluation so each test boots with a fresh
  // localStorage snapshot.
  vi.resetModules();
  return await import('@/lib/appStore');
}

describe('appStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads from localStorage on import', async () => {
    // Given: a saved store with a custom display currency
    const seed = defaultStore();
    seed.settings.displayCurrency = 'USD';
    saveStore(seed);

    // When: the appStore module is imported
    const mod = await loadFreshAppStore();

    // Then: the in-memory store reflects what was persisted
    expect(get(mod.appStore).settings.displayCurrency).toBe('USD');
  });

  it('persists changes to localStorage on every update', async () => {
    // Given: a fresh appStore instance
    const mod = await loadFreshAppStore();

    // When: a setting changes via mutate()
    mod.mutate((s: ReturnType<typeof defaultStore>) => ({
      ...s,
      settings: { ...s.settings, salaryAmount: 4200 },
    }));

    // Then: the change is persisted under the versioned root key
    const raw = localStorage.getItem(ROOT_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.settings.salaryAmount).toBe(4200);
  });

  it('syncs settings.language to the locale store on change', async () => {
    // Given: a fresh appStore
    const mod = await loadFreshAppStore();
    expect(get(mod.locale)).toBe('pt-BR');

    // When: language switches via mutate()
    mod.mutate((s: ReturnType<typeof defaultStore>) => ({
      ...s,
      settings: { ...s.settings, language: 'en' },
    }));

    // Then: the locale store reflects it
    expect(get(mod.locale)).toBe('en');
  });

  it('syncs settings.theme to the theme store on change', async () => {
    // Given: a fresh appStore
    const mod = await loadFreshAppStore();
    expect(get(mod.theme).name).toBe('dark');

    // When: theme switches
    mod.mutate((s: ReturnType<typeof defaultStore>) => ({
      ...s,
      settings: { ...s.settings, theme: 'light' },
    }));

    // Then: the theme store flips to light
    expect(get(mod.theme).name).toBe('light');
  });
});
