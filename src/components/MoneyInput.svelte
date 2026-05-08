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
    onValueChange?: (next: number) => void;
    onCurrencyChange?: (next: Currency) => void;
  }

  let {
    value = $bindable(),
    currency = $bindable(),
    currencies,
    placeholder = '0,00',
    disabled = false,
    label,
    onValueChange,
    onCurrencyChange,
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
    onValueChange?.(value);
  }

  function handleCurrencyChange(next: Currency) {
    currency = next;
    onCurrencyChange?.(next);
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
    <CurrencyPicker
      value={currency}
      options={currencies}
      {disabled}
      ariaLabel="Currency"
      onchange={handleCurrencyChange}
    />
  </div>
</label>

<style>
  .row {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .label {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.86rem;
    color: var(--text-muted);
  }
  .group {
    display: flex;
    gap: 0;
    align-items: stretch;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    background: var(--bg-glass);
    overflow: hidden;
    transition: border-color var(--motion-fast), box-shadow var(--motion-fast);
  }
  .group:focus-within {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(124, 148, 116, 0.18);
  }
  .amount {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-primary);
    padding: 10px var(--space-4);
    font: inherit;
    font-feature-settings: 'tnum';
    min-width: 0;
    min-height: 40px;
  }
  .amount:focus-visible {
    outline: none;
  }
  .group :global(.picker) {
    border: none;
    border-left: 1px solid var(--border-subtle);
    border-radius: 0;
    background: transparent;
    min-height: 40px;
  }
</style>
