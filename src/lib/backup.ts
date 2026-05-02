import type { Store } from './types';

export interface ValidationError {
  reason: string;
}

export type ValidationResult =
  | { ok: true; store: Store }
  | { ok: false; error: ValidationError };

/**
 * Strict shape check for an imported JSON payload. We deliberately do NOT
 * coerce or migrate older schemas here — Phase 2 only supports schemaVersion 1.
 */
export function validateImportedStore(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== 'object') {
    return { ok: false, error: { reason: 'not an object' } };
  }
  const o = raw as Record<string, unknown>;
  if (o.schemaVersion !== 1) {
    return { ok: false, error: { reason: 'unsupported schemaVersion' } };
  }
  const requiredKeys = ['settings', 'categories', 'accounts', 'months', 'investments'];
  for (const k of requiredKeys) {
    if (!(k in o)) return { ok: false, error: { reason: `missing key: ${k}` } };
  }
  return { ok: true, store: raw as Store };
}

export function backupFilename(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `fm-backup-${y}-${m}-${d}.json`;
}
