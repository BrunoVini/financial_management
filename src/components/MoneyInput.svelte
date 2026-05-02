<script lang="ts">
  import type { Currency } from '@/lib/types';
  import CurrencyPicker from './CurrencyPicker.svelte';

  interface Props {
    value: number;
    currency: Currency;
    currencies: Currency[];
    placeholder?: string;
    disabled?: boolean;
    label?: string;
  }

  let {
    value = $bindable(),
    currency = $bindable(),
    currencies,
    placeholder = '0,00',
    disabled = false,
    label,
  }: Props = $props();

  let raw = $state(value === 0 ? '' : String(value));

  function parseAmount(input: string): number {
    // Accept both '1.234,56' (pt-BR) and '1234.56' (en) styles. Strip spaces.
    const cleaned = input.replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  function handleInput(e: Event) {
    raw = (e.target as HTMLInputElement).value;
    value = parseAmount(raw);
  }
</script>

<label class="row">
  {#if label}
    <span class="label">{label}</span>
  {/if}
  <div class="group">
    <input
      type="text"
      inputmode="decimal"
      class="amount"
      {placeholder}
      {disabled}
      value={raw}
      oninput={handleInput}
    />
    <CurrencyPicker bind:value={currency} options={currencies} {disabled} ariaLabel="Currency" />
  </div>
</label>

<style>
  .row {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .label {
    font-size: 0.78rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .group {
    display: flex;
    gap: var(--space-1);
    align-items: stretch;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    background: var(--bg-raised);
    overflow: hidden;
  }
  .amount {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-primary);
    padding: var(--space-2) var(--space-3);
    font: inherit;
    min-width: 0;
    min-height: 36px;
  }
  .amount:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: -2px;
  }
  .group :global(.picker) {
    border: none;
    border-left: 1px solid var(--border-subtle);
    border-radius: 0;
    background: transparent;
  }
</style>
