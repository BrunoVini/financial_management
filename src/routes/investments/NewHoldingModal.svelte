<script lang="ts">
  import { t } from '@/i18n';
  import Modal from '@/components/Modal.svelte';
  import CurrencyPicker from '@/components/CurrencyPicker.svelte';
  import { mutate, settings, categories } from '@/lib/appStore';
  import { addHolding } from '@/lib/db/investments';
  import type { Currency } from '@/lib/types';

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  let name = $state('');
  let type = $state('');
  let currency = $state<Currency>($settings.displayCurrency);
  let isCrypto = $state(false);
  let coinAmount = $state(0);
  let error = $state<string | null>(null);

  $effect(() => {
    if (open) {
      name = '';
      const firstType = $categories.investment.find((c) => !c.archived);
      type = firstType?.name ?? 'Crypto';
      currency = $settings.displayCurrency;
      isCrypto = false;
      coinAmount = 0;
      error = null;
    }
  });

  function submit(e: Event) {
    e.preventDefault();
    error = null;
    if (!name.trim()) {
      error = $t('inv.new.error.name');
      return;
    }
    if (isCrypto && coinAmount < 0) {
      error = $t('inv.new.error.amount');
      return;
    }
    mutate((s) =>
      addHolding(s, {
        name: name.trim(),
        type: type.trim() || 'Crypto',
        currency,
        ...(isCrypto ? { coinId: 'bitcoin', coinAmount } : {}),
      }),
    );
    onclose();
  }
</script>

<Modal {open} title={$t('inv.new.title')} {onclose}>
  <form id="new-holding-form" onsubmit={submit}>
    <label>
      <span>{$t('inv.new.name')}</span>
      <input type="text" bind:value={name} autocomplete="off" />
    </label>

    <label class="toggle">
      <input type="checkbox" bind:checked={isCrypto} />
      <span>{$t('inv.new.crypto')}</span>
    </label>

    {#if !isCrypto}
      <label>
        <span>{$t('inv.new.type')}</span>
        <input type="text" bind:value={type} autocomplete="off" />
      </label>
    {:else}
      <label>
        <span>{$t('inv.new.coinAmount')}</span>
        <input type="number" inputmode="decimal" step="0.00000001" min="0" bind:value={coinAmount} />
      </label>
    {/if}

    <label>
      <span>{$t('inv.new.currency')}</span>
      <CurrencyPicker bind:value={currency} options={$settings.activeCurrencies} />
    </label>

    {#if error}<p class="error" role="alert">{error}</p>{/if}
  </form>

  {#snippet footer()}
    <button type="button" onclick={onclose}>{$t('common.cancel')}</button>
    <button type="submit" form="new-holding-form" class="primary">{$t('inv.new.create')}</button>
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
  label.toggle {
    flex-direction: row;
    align-items: center;
    gap: var(--space-2);
  }
  label.toggle input {
    width: auto;
    min-height: 0;
  }
  input[type='text'],
  input[type='number'] {
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
