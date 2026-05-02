import { writable } from 'svelte/store';

export type TransactionModalKind = 'expense' | 'income' | 'fx' | 'salary' | null;

export const transactionModal = writable<TransactionModalKind>(null);

export function openTransactionModal(kind: Exclude<TransactionModalKind, null>): void {
  transactionModal.set(kind);
}

export function closeTransactionModal(): void {
  transactionModal.set(null);
}
