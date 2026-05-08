<script lang="ts">
  import { get } from 'svelte/store';
  import { t } from '@/i18n';
  import Modal from '@/components/Modal.svelte';
  import MoneyInput from '@/components/MoneyInput.svelte';
  import { appStore, mutate, settings } from '@/lib/appStore';
  import { addFxTransfer } from '@/lib/db/transactions';
  import { monthKey as toMonthKey } from '@/lib/db/months';
  import { listAccountsByCurrency, accountBalance } from '@/lib/db/accounts';
  import type { Currency } from '@/lib/types';

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  let fromCurrency = $state<Currency>($settings.activeCurrencies[0] ?? 'BRL');
  let toCurrency = $state<Currency>(
    $settings.activeCurrencies.find((c) => c !== fromCurrency) ?? 'USD',
  );
  let fromAmount = $state(0);
  let toAmount = $state(0);
  let date = $state(new Date().toISOString().slice(0, 10));
  let error = $state<string | null>(null);

  $effect(() => {
    if (open) {
      fromCurrency = $settings.activeCurrencies[0] ?? 'BRL';
      toCurrency = $settings.activeCurrencies.find((c) => c !== fromCurrency) ?? 'USD';
      fromAmount = 0;
      toAmount = 0;
      date = new Date().toISOString().slice(0, 10);
      error = null;
    }
  });

  let computedRate = $derived(fromAmount > 0 ? toAmount / fromAmount : 0);

  function submit(e: Event) {
    e.preventDefault();
    error = null;
    if (fromCurrency === toCurrency) {
      error = 'From and To must be different currencies.';
      return;
    }
    if (fromAmount <= 0 || toAmount <= 0) {
      error = 'Both amounts must be greater than zero.';
      return;
    }
    const key = toMonthKey(new Date(date));
    const store = get(appStore);
    if (!store.months[key]) {
      error = 'No month exists for this date yet.';
      return;
    }
    // Sum balances of every account in the source currency. The user can
    // only convert what they actually hold in fromCurrency.
    const sourceAccounts = listAccountsByCurrency(store, fromCurrency);
    const totalSource = sourceAccounts.reduce(
      (sum, a) => sum + accountBalance(store, a.id, key),
      0,
    );
    if (totalSource < fromAmount) {
      error = $t('tx.error.fxNegative').replace('{currency}', fromCurrency);
      return;
    }
    mutate(
      (s) =>
        addFxTransfer(s, key, {
          fromCurrency,
          toCurrency,
          fromAmount,
          toAmount,
          rate: computedRate,
          date,
        }).store,
    );
    onclose();
  }
</script>

<Modal {open} title={$t('tx.fx.title')} {onclose}>
  <form id="fx-form" onsubmit={submit}>
    <MoneyInput
      label={$t('tx.fx.from')}
      bind:value={fromAmount}
      bind:currency={fromCurrency}
      currencies={$settings.activeCurrencies}
    />
    <MoneyInput
      label={$t('tx.fx.to')}
      bind:value={toAmount}
      bind:currency={toCurrency}
      currencies={$settings.activeCurrencies}
    />
    <p class="rate">{$t('tx.fx.rate')}: {computedRate.toFixed(4)}</p>

    <label>
      <span>{$t('tx.date')}</span>
      <input type="date" bind:value={date} />
    </label>

    {#if error}<p class="error" role="alert">{error}</p>{/if}
  </form>

  {#snippet footer()}
    <button type="button" onclick={onclose}>{$t('common.cancel')}</button>
    <button type="submit" form="fx-form" class="primary">{$t('tx.add')}</button>
  {/snippet}
</Modal>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .rate {
    margin: 0;
    font-size: 0.82rem;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-family: var(--font-display);
    font-style: italic;
    color: var(--text-muted);
    font-size: 0.92rem;
  }
  input[type='date'] {
    background: var(--bg-glass);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    font: inherit;
    min-height: 36px;
  }
  .error {
    color: var(--negative);
    margin: 0;
    font-size: 0.86rem;
  }
  button {
    padding: 10px var(--space-5);
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-pill);
    cursor: pointer;
    font: inherit;
    font-weight: 600;
    min-height: 40px;
    transition: border-color var(--motion-fast), color var(--motion-fast);
  }
  button:hover { border-color: var(--text-muted); color: var(--text-primary); }
  button.primary {
    background: var(--accent-gradient);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 4px 14px rgba(124, 148, 116, 0.22);
  }
  button.primary:hover { color: #fff; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(124, 148, 116, 0.3); }
</style>
