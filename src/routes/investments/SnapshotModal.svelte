<script lang="ts">
  import { t } from '@/i18n';
  import Modal from '@/components/Modal.svelte';
  import MoneyInput from '@/components/MoneyInput.svelte';
  import { mutate, settings, investments } from '@/lib/appStore';
  import { addSnapshot } from '@/lib/db/investments';
  import { monthKey as toMonthKey } from '@/lib/db/months';
  import type { Currency } from '@/lib/types';

  interface Props {
    open: boolean;
    onclose: () => void;
    presetHoldingId?: string;
  }

  let { open, onclose, presetHoldingId }: Props = $props();

  let holdingId = $state('');
  let value = $state(0);
  let currency = $state<Currency>($settings.displayCurrency);
  let takenAt = $state(new Date().toISOString().slice(0, 10));
  let error = $state<string | null>(null);

  $effect(() => {
    if (open) {
      const fallback = $investments.holdings[0]?.id ?? '';
      holdingId = presetHoldingId ?? fallback;
      const h = $investments.holdings.find((x) => x.id === holdingId);
      currency = h?.currency ?? $settings.displayCurrency;
      value = 0;
      takenAt = new Date().toISOString().slice(0, 10);
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
    if (value < 0) {
      error = 'Value cannot be negative.';
      return;
    }
    const key = toMonthKey(new Date(takenAt));
    mutate((s) =>
      addSnapshot(s, {
        holdingId,
        monthKey: key,
        marketValue: value,
        currency,
        takenAt,
      }),
    );
    onclose();
  }
</script>

<Modal {open} title={$t('inv.snapshot.title')} {onclose}>
  <form id="snap-form" onsubmit={submit}>
    <label>
      <span>{$t('inv.holding')}</span>
      <select bind:value={holdingId}>
        {#each $investments.holdings as h (h.id)}
          <option value={h.id}>{h.name} · {h.currency}</option>
        {/each}
      </select>
    </label>

    <MoneyInput
      label={$t('inv.value')}
      bind:value
      bind:currency
      currencies={$settings.activeCurrencies}
    />

    <label>
      <span>{$t('inv.takenAt')}</span>
      <input type="date" bind:value={takenAt} />
    </label>

    {#if error}<p class="error" role="alert">{error}</p>{/if}
  </form>

  {#snippet footer()}
    <button type="button" onclick={onclose}>{$t('common.cancel')}</button>
    <button type="submit" form="snap-form" class="primary">{$t('inv.snapshot.save')}</button>
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
