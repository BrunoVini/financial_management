import type { Category, Language, Store } from '../types';
import { newId } from '../uuid';

export type CategoryKind = 'expense' | 'investment';

const PALETTE = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#10b981',
  '#06b6d4',
  '#6366f1',
  '#8b5cf6',
];

const EXPENSE_NAMES: Record<Language, string[]> = {
  'pt-BR': ['Mercado', 'Aluguel', 'Transporte', 'Lazer', 'Saúde', 'Contas', 'Restaurantes', 'Outros'],
  en: ['Groceries', 'Rent', 'Transport', 'Leisure', 'Health', 'Bills', 'Restaurants', 'Other'],
};

const INVESTMENT_NAMES: Record<Language, string[]> = {
  'pt-BR': ['Renda Fixa', 'Ações', 'FIIs', 'Cripto', 'Tesouro Direto'],
  en: ['Fixed Income', 'Stocks', 'REITs', 'Crypto', 'Government Bonds'],
};

function build(names: string[]): Category[] {
  return names.map((name, i) => ({
    id: newId(),
    name,
    color: PALETTE[i % PALETTE.length],
    archived: false,
  }));
}

export function defaultExpenseCategories(language: Language): Category[] {
  return build(EXPENSE_NAMES[language]);
}

export function defaultInvestmentCategories(language: Language): Category[] {
  return build(INVESTMENT_NAMES[language]);
}

export type NewCategory = { name: string; color: string; icon?: string };

export function addCategory(store: Store, kind: CategoryKind, input: NewCategory): Store {
  const cat: Category = { id: newId(), archived: false, ...input };
  return {
    ...store,
    categories: { ...store.categories, [kind]: [...store.categories[kind], cat] },
  };
}

export function updateCategory(
  store: Store,
  kind: CategoryKind,
  id: string,
  patch: Partial<Category>,
): Store {
  return {
    ...store,
    categories: {
      ...store.categories,
      [kind]: store.categories[kind].map((c) => (c.id === id ? { ...c, ...patch, id: c.id } : c)),
    },
  };
}

export function archiveCategory(store: Store, kind: CategoryKind, id: string): Store {
  return updateCategory(store, kind, id, { archived: true });
}

export function unarchiveCategory(store: Store, kind: CategoryKind, id: string): Store {
  return updateCategory(store, kind, id, { archived: false });
}

export function removeCategory(store: Store, kind: CategoryKind, id: string): Store {
  return {
    ...store,
    categories: {
      ...store.categories,
      [kind]: store.categories[kind].filter((c) => c.id !== id),
    },
  };
}
