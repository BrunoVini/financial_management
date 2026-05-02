import { describe, expect, it } from 'vitest';
import { validateImportedStore, backupFilename } from '@/lib/backup';
import { defaultStore } from '@/lib/storage';

describe('validateImportedStore', () => {
  it('accepts a well-formed default store', () => {
    // Given: a default store
    const s = defaultStore();
    // When: validating it
    const r = validateImportedStore(s);
    // Then: ok with the same payload
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.store.schemaVersion).toBe(1);
  });

  it('rejects null and primitives', () => {
    // Given/When: validating non-objects
    // Then: each is rejected with a reason
    expect(validateImportedStore(null).ok).toBe(false);
    expect(validateImportedStore(42).ok).toBe(false);
    expect(validateImportedStore('hi').ok).toBe(false);
  });

  it('rejects payloads with the wrong schemaVersion', () => {
    // Given: a payload claiming v2
    const bogus = { ...defaultStore(), schemaVersion: 2 };
    // When/Then: rejected
    expect(validateImportedStore(bogus).ok).toBe(false);
  });

  it('rejects payloads missing required keys', () => {
    // Given: a payload without `accounts`
    const partial: Record<string, unknown> = { ...defaultStore() };
    delete partial.accounts;
    // When/Then: rejected
    const r = validateImportedStore(partial);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.reason).toContain('accounts');
  });
});

describe('backupFilename', () => {
  it('formats fm-backup-YYYY-MM-DD.json', () => {
    // Given: a specific date
    // When: generating the filename
    // Then: it follows the pattern (UTC)
    expect(backupFilename(new Date('2026-05-02T12:00:00Z'))).toBe('fm-backup-2026-05-02.json');
    expect(backupFilename(new Date('2026-12-31T23:00:00Z'))).toBe('fm-backup-2026-12-31.json');
  });
});
