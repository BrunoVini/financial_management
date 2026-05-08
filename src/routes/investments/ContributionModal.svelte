<script lang="ts">
  import { get } from 'svelte/store';
  import { t } from '@/i18n';
  import Modal from '@/components/Modal.svelte';
  import MoneyInput from '@/components/MoneyInput.svelte';
  import { appStore, mutate, settings, investments } from '@/lib/appStore';
  import { addContribution } from '@/lib/db/investments';
  import { monthKey as toMonthKey } from '@/lib/db/months';
  import type { Currency } from '@/lib/types';

  interface Props {
    open: boolean;
    onclose: () => void;
    presetHoldingId?: string;
  }

  let { open, onclose, presetHoldingId }: Props = $props();

  let holdingId = $state('');
  let amount = $state(0);
  let currency = $state<Currency>($settings.displayCurrency);
  let date = $state(new Date().toISOString().slice(0, 10));
  let error = $state<string | null>(null);

  $effect(() => {
    if (open) {
      const fallback = $investments.holdings[0]?.id ?? '';
      holdingId = presetHoldingId ?? fallback;
      const h = $investments.holdings.find((x) => x.id === holdingId);
      currency = h?.currency ?? $settings.displayCurrency;
      amount = 0;
      date = new Date().toISOString().slice(0, 10);
      error = null;
    }
  });

  function submit(e: Event) {
    e.preventDefault();
    error = null;
    if (!holdingId) {
      error = 'Select a holding first.';
      return;
    }
    if (amount <= 0) {
      error = 'Amount must be greater than zero.';
      return;
    }
    const key = toMonthKey(new Date(date));
    if (!get(appStore).months[key]) {
      error = 'No month exists for this date yet.';
      return;
    }
    mutate((s) =>
      addContribution(s, {
        holdingId,
        monthKey: key,
        amount,
        currency,
        date,
      }),
    );
    onclose();
  }
</script>

<Modal {open} title={$t('inv.contribute.title')} {onclose}>
  <form id="contrib-form" onsubmit={submit}>
    <label>
      <span>{$t('inv.holding')}</span>
      <select bind:value={holdingId}>
        {#each $investments.holdings as h (h.id)}
          <option value={h.id}>{h.name} · {h.currency}</option>
        {/each}
      </select>
    </label>

    <MoneyInput
      label={$t('inv.amount')}
      bind:value={amount}
      bind:currency
      currencies={$settings.activeCurrencies}
    />

    <label>
      <span>{$t('inv.takenAt')}</span>
      <input type="date" bind:value={date} />
    </label>

    {#if error}<p class="error" role="alert">{error}</p>{/if}
  </form>

  {#snippet footer()}
    <button type="button" onclick={onclose}>{$t('common.cancel')}</button>
    <button type="submit" form="contrib-form" class="primary">{$t('inv.contribute.add')}</button>
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
  select,
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
