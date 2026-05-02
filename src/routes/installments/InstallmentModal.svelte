<script lang="ts">
  import { get } from 'svelte/store';
  import { t } from '@/i18n';
  import Modal from '@/components/Modal.svelte';
  import MoneyInput from '@/components/MoneyInput.svelte';
  import { appStore, mutate, settings, accounts, categories } from '@/lib/appStore';
  import { addInstallmentPlan } from '@/lib/db/installments';
  import { monthKey as toMonthKey } from '@/lib/db/months';
  import type { Currency } from '@/lib/types';

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  let description = $state('');
  let total = $state(0);
  let count = $state(2);
  let currency = $state<Currency>($settings.displayCurrency);
  let categoryId = $state('');
  let accountId = $state('');
  let firstMonth = $state(toMonthKey(new Date()));
  let error = $state<string | null>(null);

  $effect(() => {
    if (open) {
      description = '';
      total = 0;
      count = 2;
      currency = $settings.displayCurrency;
      categoryId = $categories.expense.find((c) => !c.archived)?.id ?? '';
      accountId = $accounts.find((a) => a.currency === currency)?.id ?? '';
      firstMonth = toMonthKey(new Date());
      error = null;
    }
  });

  $effect(() => {
    const match = $accounts.find((a) => a.currency === currency);
    if (match && !$accounts.some((a) => a.id === accountId && a.currency === currency)) {
      accountId = match.id;
    }
  });

  let visibleCategories = $derived($categories.expense.filter((c) => !c.archived));
  let visibleAccounts = $derived($accounts.filter((a) => a.currency === currency));
  let perInstallment = $derived(count > 0 ? total / count : 0);

  function submit(e: Event) {
    e.preventDefault();
    error = null;
    if (total <= 0) {
      error = $t('inst.error.total');
      return;
    }
    if (count < 1 || !Number.isInteger(count)) {
      error = $t('inst.error.count');
      return;
    }
    if (!description.trim() || !categoryId || !accountId) {
      error = $t('tx.error.negative').replace('Saldo da conta ficaria negativo. ', '');
      return;
    }
    if (!get(appStore).months[firstMonth]) {
      error = 'No month exists for this date yet.';
      return;
    }
    mutate(
      (s) =>
        addInstallmentPlan(s, {
          description: description.trim(),
          totalAmount: total,
          installmentCount: count,
          currency,
          accountId,
          categoryId,
          firstMonthKey: firstMonth,
        }).store,
    );
    onclose();
  }
</script>

<Modal {open} title={$t('inst.modal.title')} {onclose}>
  <form id="inst-form" onsubmit={submit}>
    <label>
      <span>{$t('inst.description')}</span>
      <input type="text" bind:value={description} placeholder="—" />
    </label>

    <MoneyInput
      label={$t('inst.total')}
      bind:value={total}
      bind:currency
      currencies={$settings.activeCurrencies}
    />

    <label>
      <span>{$t('inst.count')}</span>
      <input
        type="number"
        min="1"
        max="240"
        inputmode="numeric"
        value={count}
        oninput={(e) => (count = Math.max(1, Math.floor(Number((e.target as HTMLInputElement).value) || 1)))}
      />
    </label>

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
      <span>{$t('inst.first')}</span>
      <input type="month" bind:value={firstMonth} />
    </label>

    <p class="per">
      {$t('inst.per')}: <strong>{perInstallment.toFixed(2)} {currency}</strong>
    </p>

    {#if error}<p class="error" role="alert">{error}</p>{/if}
  </form>

  {#snippet footer()}
    <button type="button" onclick={onclose}>{$t('common.cancel')}</button>
    <button type="submit" form="inst-form" class="primary">{$t('inst.add')}</button>
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
  input[type='text'],
  input[type='number'],
  input[type='month'],
  select {
    background: var(--bg-glass);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    font: inherit;
    min-height: 36px;
  }
  .per {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.86rem;
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
