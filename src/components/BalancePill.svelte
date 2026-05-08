<script lang="ts">
  import { formatMoney } from '@/lib/money';
  import type { Currency, Language } from '@/lib/types';

  interface Props {
    amount: number;
    currency: Currency;
    convertedAmount?: number;
    convertedCurrency?: Currency;
    language: Language;
  }

  let { amount, currency, convertedAmount, convertedCurrency, language }: Props = $props();
</script>

<span class="pill" data-currency={currency}>
  <span class="code">{currency}</span>
  <span class="amount">{formatMoney(amount, currency, language)}</span>
  {#if convertedAmount !== undefined && convertedCurrency && convertedCurrency !== currency}
    <span class="conv">≈ {formatMoney(convertedAmount, convertedCurrency, language)}</span>
  {/if}
</span>

<style>
  .pill {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-2);
    padding: 8px 14px;
    background: var(--bg-glass);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-pill);
    font-variant-numeric: tabular-nums;
    transition: border-color var(--motion-fast);
  }
  .pill:hover {
    border-color: var(--text-muted);
  }
  .code {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: var(--text-muted);
  }
  .amount {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .conv {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.82rem;
    color: var(--text-muted);
  }
</style>
