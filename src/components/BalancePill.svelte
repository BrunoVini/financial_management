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
  {#if convertedAmount !== undefined && Number.isFinite(convertedAmount) && convertedCurrency && convertedCurrency !== currency}
    <span class="conv">≈ {formatMoney(convertedAmount, convertedCurrency, language)}</span>
  {/if}
</span>

<style>
  .pill {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--bg-glass);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-pill);
    font-variant-numeric: tabular-nums;
  }
  .code {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
    text-transform: uppercase;
  }
  .amount {
    font-size: 0.95rem;
    color: var(--text-primary);
  }
  .conv {
    font-size: 0.78rem;
    color: var(--text-muted);
  }
</style>
