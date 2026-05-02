<script lang="ts">
  import { get } from 'svelte/store';
  import { t } from '@/i18n';
  import Modal from '@/components/Modal.svelte';
  import MoneyInput from '@/components/MoneyInput.svelte';
  import { appStore, mutate, settings } from '@/lib/appStore';
  import { addIncome } from '@/lib/db/transactions';
  import { monthKey as toMonthKey } from '@/lib/db/months';
  import type { Currency } from '@/lib/types';

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  let amount = $state(0);
  let currency = $state<Currency>($settings.displayCurrency);
  let date = $state(new Date().toISOString().slice(0, 10));
  let note = $state('');
  let error = $state<string | null>(null);

  $effect(() => {
    if (open) {
      amount = 0;
      currency = $settings.displayCurrency;
      date = new Date().toISOString().slice(0, 10);
      note = '';
      error = null;
    }
  });

  function submit(e: Event) {
    e.preventDefault();
    error = null;
    if (amount <= 0) {
      error = 'Amount must be greater than zero.';
      return;
    }
    const key = toMonthKey(new Date(date));
    if (!get(appStore).months[key]) {
      error = 'No month exists for this date yet.';
      return;
    }
    mutate(
      (s) =>
        addIncome(s, key, {
          amount,
          currency,
          note: note.trim() || undefined,
          date,
        }).store,
    );
    onclose();
  }
</script>

<Modal {open} title={$t('tx.income.title')} {onclose}>
  <form id="income-form" onsubmit={submit}>
    <MoneyInput
      label={$t('tx.amount')}
      bind:value={amount}
      bind:currency
      currencies={$settings.activeCurrencies}
    />

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
    <button type="submit" form="income-form" class="primary">{$t('tx.add')}</button>
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
