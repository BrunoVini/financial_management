<script lang="ts">
  import { get } from 'svelte/store';
  import { t } from '@/i18n';
  import Modal from '@/components/Modal.svelte';
  import MoneyInput from '@/components/MoneyInput.svelte';
  import { appStore, mutate, settings, accounts, categories } from '@/lib/appStore';
  import { addExpense } from '@/lib/db/transactions';
  import { monthKey as toMonthKey } from '@/lib/db/months';
  import { accountBalance } from '@/lib/db/accounts';
  import { convert } from '@/lib/money';
  import type { Currency } from '@/lib/types';

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  const today = new Date().toISOString().slice(0, 10);

  let amount = $state(0);
  let currency = $state<Currency>($settings.displayCurrency);
  let categoryId = $state('');
  let accountId = $state('');
  let date = $state(today);
  let note = $state('');
  let error = $state<string | null>(null);

  $effect(() => {
    if (open) {
      amount = 0;
      currency = $settings.displayCurrency;
      categoryId = $categories.expense.find((c) => !c.archived)?.id ?? '';
      const matching = $accounts.find((a) => a.currency === currency);
      accountId = matching?.id ?? '';
      date = new Date().toISOString().slice(0, 10);
      note = '';
      error = null;
    }
  });

  $effect(() => {
    // Auto-pick first account in the chosen currency when currency flips.
    const match = $accounts.find((a) => a.currency === currency);
    if (match && !$accounts.some((a) => a.id === accountId && a.currency === currency)) {
      accountId = match.id;
    }
  });

  let visibleCategories = $derived($categories.expense.filter((c) => !c.archived));
  let visibleAccounts = $derived($accounts.filter((a) => a.currency === currency));

  function submit(e: Event) {
    e.preventDefault();
    error = null;
    if (amount <= 0) {
      error = 'Amount must be greater than zero.';
      return;
    }
    if (!categoryId) {
      error = 'Please pick a category.';
      return;
    }
    if (!accountId) {
      error = 'Please pick an account.';
      return;
    }
    const todayKey = toMonthKey(new Date(date));
    const store = get(appStore);
    if (!store.months[todayKey]) {
      error = 'No month exists for this date yet.';
      return;
    }
    const account = store.accounts.find((a) => a.id === accountId);
    if (account) {
      const current = accountBalance(store, accountId, todayKey);
      // Expense currency may differ from the account currency: convert
      // to the account's native currency using live rates before
      // checking. NaN guard: if rates aren't loaded yet, skip the check
      // rather than block the user.
      const rates = store.ratesCache?.rates ?? {};
      const inAccountCurrency =
        currency === account.currency
          ? amount
          : convert(amount, currency, account.currency, rates);
      if (Number.isFinite(inAccountCurrency) && current - inAccountCurrency < 0) {
        error = $t('tx.error.negative');
        return;
      }
    }
    mutate(
      (s) =>
        addExpense(s, todayKey, {
          amount,
          currency,
          categoryId,
          accountId,
          note: note.trim() || undefined,
          date,
        }).store,
    );
    onclose();
  }
</script>

<Modal {open} title={$t('tx.expense.title')} {onclose}>
  <form id="expense-form" onsubmit={submit}>
    <MoneyInput
      label={$t('tx.amount')}
      bind:value={amount}
      bind:currency
      currencies={$settings.activeCurrencies}
    />

    <label>
      <span>{$t('tx.category')}</span>
      <select bind:value={categoryId}>
        {#each visibleCategories as cat (cat.id)}
          <option value={cat.id}>{cat.name}</option>
        {/each}
      </select>
    </label>

    <label>
      <span>{$t('tx.account')}</span>
      <select bind:value={accountId}>
        {#each visibleAccounts as acc (acc.id)}
          <option value={acc.id}>{acc.name}</option>
        {/each}
      </select>
    </label>

    <label>
      <span>{$t('tx.date')}</span>
      <input type="date" bind:value={date} />
    </label>

    <label>
      <span>{$t('tx.note')}</span>
      <textarea bind:value={note} rows="2"></textarea>
    </label>

    {#if error}<p class="error" role="alert">{error}</p>{/if}
  </form>

  {#snippet footer()}
    <button type="button" onclick={onclose}>{$t('common.cancel')}</button>
    <button type="submit" form="expense-form" class="primary">{$t('tx.add')}</button>
  {/snippet}
</Modal>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  label {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    color: var(--text-secondary);
    font-size: 0.82rem;
  }
  select,
  input[type='date'],
  textarea {
    background: var(--bg-glass);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    font: inherit;
    min-height: 36px;
  }
  textarea {
    resize: vertical;
    min-height: 60px;
  }
  .error {
    color: var(--negative);
    margin: 0;
    font-size: 0.86rem;
  }
  button {
    padding: var(--space-2) var(--space-4);
    background: var(--bg-glass);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    cursor: pointer;
    font: inherit;
    min-height: 40px;
  }
  button.primary {
    background: var(--accent-gradient);
    color: white;
    border-color: transparent;
  }
</style>
