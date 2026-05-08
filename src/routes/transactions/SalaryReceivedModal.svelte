<script lang="ts">
  import { get } from 'svelte/store';
  import { t } from '@/i18n';
  import Modal from '@/components/Modal.svelte';
  import MoneyInput from '@/components/MoneyInput.svelte';
  import { appStore, mutate, settings } from '@/lib/appStore';
  import { setSalaryReceived } from '@/lib/db/transactions';
  import { monthKey as toMonthKey } from '@/lib/db/months';
  import { convert } from '@/lib/money';
  import type { Currency } from '@/lib/types';

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  let amount = $state(0);
  let currency = $state<Currency>($settings.salaryCurrency);
  let receivedAt = $state(new Date().toISOString().slice(0, 10));
  let rate = $state(1);
  let error = $state<string | null>(null);

  function suggestRate(c: Currency, display: Currency): number {
    if (c === display) return 1;
    const cache = get(appStore).ratesCache;
    if (!cache) return 1;
    const v = convert(1, c, display, cache.rates);
    return Number.isFinite(v) ? v : 1;
  }

  $effect(() => {
    if (open) {
      amount = $settings.salaryAmount;
      currency = $settings.salaryCurrency;
      receivedAt = new Date().toISOString().slice(0, 10);
      rate = suggestRate(currency, $settings.displayCurrency);
      error = null;
    }
  });

  $effect(() => {
    rate = suggestRate(currency, $settings.displayCurrency);
  });

  function submit(e: Event) {
    e.preventDefault();
    error = null;
    if (amount <= 0) {
      error = 'Amount must be greater than zero.';
      return;
    }
    if (rate <= 0) {
      error = 'Rate must be greater than zero.';
      return;
    }
    const key = toMonthKey(new Date(receivedAt));
    if (!get(appStore).months[key]) {
      error = 'No month exists for this date yet.';
      return;
    }
    mutate((s) =>
      setSalaryReceived(s, key, {
        amount,
        currency,
        rateToDisplay: rate,
        receivedAt,
      }),
    );
    onclose();
  }
</script>

<Modal {open} title={$t('tx.salary.title')} {onclose}>
  <form id="salary-form" onsubmit={submit}>
    <MoneyInput
      label={$t('tx.amount')}
      bind:value={amount}
      bind:currency
      currencies={$settings.activeCurrencies}
    />

    <label>
      <span>{$t('tx.salary.received')}</span>
      <input type="date" bind:value={receivedAt} />
    </label>

    <label>
      <span>{$t('tx.salary.rate')} ({currency} → {$settings.displayCurrency})</span>
      <input
        type="number"
        step="0.0001"
        min="0"
        inputmode="decimal"
        value={rate}
        oninput={(e) => (rate = Number((e.target as HTMLInputElement).value))}
        disabled={currency === $settings.displayCurrency}
      />
      <small class="hint">{$t('tx.salary.rate.help')}</small>
    </label>

    {#if error}<p class="error" role="alert">{error}</p>{/if}
  </form>

  {#snippet footer()}
    <button type="button" onclick={onclose}>{$t('common.cancel')}</button>
    <button type="submit" form="salary-form" class="primary">{$t('common.save')}</button>
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
    gap: 6px;
    font-family: var(--font-display);
    font-style: italic;
    color: var(--text-muted);
    font-size: 0.92rem;
  }
  input[type='date'],
  input[type='number'] {
    background: var(--bg-glass);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    font: inherit;
    min-height: 36px;
  }
  .hint {
    color: var(--text-muted);
    font-size: 0.78rem;
    line-height: 1.4;
    margin-top: 2px;
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
