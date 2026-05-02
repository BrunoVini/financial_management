import { describe, expect, it } from 'vitest';
import { loadStore, saveStore, defaultStore, ROOT_KEY } from '../src/lib/storage';

describe('storage', () => {
  it('returns defaultStore when nothing is persisted', () => {
    // Given: localStorage is empty (cleared by global setup)

    // When: loadStore() is called
    const store = loadStore();

    // Then: a fresh defaultStore is returned (schema v1, not onboarded)
    expect(store.schemaVersion).toBe(1);
    expect(store.settings.onboarded).toBe(false);
  });

  it('round-trips a store through localStorage', () => {
    // Given: a store with a non-default language
    const s = defaultStore();
    s.settings.language = 'en';

    // When: it is saved and then loaded back
    saveStore(s);
    const loaded = loadStore();

    // Then: the language change survives the round trip
    expect(loaded.settings.language).toBe('en');
  });

  it('persists under the versioned root key', () => {
    // Given: nothing persisted yet

    // When: a default store is saved
    saveStore(defaultStore());

    // Then: the data lives under the documented ROOT_KEY
    expect(localStorage.getItem(ROOT_KEY)).not.toBeNull();
  });

  it('falls back to defaultStore on malformed JSON', () => {
    // Given: ROOT_KEY contains invalid JSON
    localStorage.setItem(ROOT_KEY, '{not json');

    // When: loadStore() is called
    const store = loadStore();

    // Then: it returns the default store instead of throwing
    expect(store.schemaVersion).toBe(1);
  });

  it('falls back to defaultStore when schemaVersion is missing', () => {
    // Given: ROOT_KEY contains valid JSON without a recognised schemaVersion
    localStorage.setItem(ROOT_KEY, JSON.stringify({ foo: 'bar' }));

    // When: loadStore() is called
    const store = loadStore();

    // Then: the unknown payload is rejected and the default store is returned
    expect(store.schemaVersion).toBe(1);
  });
});
