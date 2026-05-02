import { describe, expect, it } from 'vitest';
import {
  defaultExpenseCategories,
  defaultInvestmentCategories,
  addCategory,
  updateCategory,
  archiveCategory,
  unarchiveCategory,
  removeCategory,
} from '@/lib/db/categories';
import { defaultStore } from '@/lib/storage';

describe('default category seeds', () => {
  it('returns 8 expense categories in pt-BR with localized names', () => {
    // Given/When: seeding pt-BR
    const cats = defaultExpenseCategories('pt-BR');
    // Then: 8 entries with localized names and a color each
    expect(cats).toHaveLength(8);
    expect(cats[0].name).toBe('Mercado');
    cats.forEach((c) => {
      expect(c.id).toBeTruthy();
      expect(c.color).toMatch(/^#/);
      expect(c.archived).toBe(false);
    });
  });

  it('returns 8 expense categories in en with localized names', () => {
    const cats = defaultExpenseCategories('en');
    expect(cats).toHaveLength(8);
    expect(cats[0].name).toBe('Groceries');
  });

  it('returns 5 investment categories per language', () => {
    expect(defaultInvestmentCategories('pt-BR')).toHaveLength(5);
    expect(defaultInvestmentCategories('en')).toHaveLength(5);
    expect(defaultInvestmentCategories('pt-BR')[0].name).toBe('Renda Fixa');
    expect(defaultInvestmentCategories('en')[0].name).toBe('Fixed Income');
  });
});

describe('addCategory', () => {
  it('appends a new category and assigns an id', () => {
    // Given: an empty store
    const s = defaultStore();
    // When: a category is added
    const next = addCategory(s, 'expense', { name: 'Pets', color: '#ff0000' });
    // Then: it appears in the list with a generated id
    expect(next.categories.expense).toHaveLength(1);
    expect(next.categories.expense[0].name).toBe('Pets');
    expect(next.categories.expense[0].id).toBeTruthy();
    expect(next.categories.expense[0].archived).toBe(false);
  });
});

describe('updateCategory', () => {
  it('patches a category by id without changing the id', () => {
    // Given: a store with one category
    const s0 = defaultStore();
    const s1 = addCategory(s0, 'expense', { name: 'Pets', color: '#ff0000' });
    const id = s1.categories.expense[0].id;
    // When: it is updated
    const s2 = updateCategory(s1, 'expense', id, { name: 'Animals' });
    // Then: the patch applied and the id is preserved
    expect(s2.categories.expense[0].name).toBe('Animals');
    expect(s2.categories.expense[0].id).toBe(id);
  });
});

describe('archiveCategory', () => {
  it('flips archived to true and unarchive flips back', () => {
    // Given: a fresh category
    const s0 = defaultStore();
    const s1 = addCategory(s0, 'expense', { name: 'Pets', color: '#ff0000' });
    const id = s1.categories.expense[0].id;
    // When: archived then unarchived
    const s2 = archiveCategory(s1, 'expense', id);
    const s3 = unarchiveCategory(s2, 'expense', id);
    // Then: states transition as expected
    expect(s2.categories.expense[0].archived).toBe(true);
    expect(s3.categories.expense[0].archived).toBe(false);
  });
});

describe('removeCategory', () => {
  it('drops the category by id', () => {
    // Given: store with two categories
    const s0 = defaultStore();
    const s1 = addCategory(s0, 'expense', { name: 'A', color: '#000' });
    const s2 = addCategory(s1, 'expense', { name: 'B', color: '#fff' });
    const idA = s2.categories.expense[0].id;
    // When: removing the first
    const s3 = removeCategory(s2, 'expense', idA);
    // Then: only the second remains
    expect(s3.categories.expense).toHaveLength(1);
    expect(s3.categories.expense[0].name).toBe('B');
  });
});
