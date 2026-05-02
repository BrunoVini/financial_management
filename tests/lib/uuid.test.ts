import { describe, expect, it } from 'vitest';
import { newId } from '@/lib/uuid';

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('newId', () => {
  it('returns a string in UUIDv4 shape', () => {
    // Given: a fresh call
    // When: newId() runs
    const id = newId();
    // Then: the result is a UUID v4 string
    expect(typeof id).toBe('string');
    expect(id).toMatch(UUID_V4_RE);
  });

  it('returns a different value on each call', () => {
    // Given/When: two consecutive calls
    const a = newId();
    const b = newId();
    // Then: collisions are not expected (UUIDv4 randomness)
    expect(a).not.toBe(b);
  });
});
