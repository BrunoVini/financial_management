<script lang="ts">
  import { t } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import { wizard } from './state';
  import type { Currency } from '@/lib/types';

  function setBalance(currency: Currency, value: number) {
    wizard.update((w) => ({
      ...w,
      openingBalances: { ...w.openingBalances, [currency]: value },
    }));
  }

  function parseAmount(input: string): number {
    const cleaned = input
      .replace(/\s/g, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '')
      .replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
</script>

<Card padding="lg">
  <header class="head">
    <h4>{$t('onboarding.balances.title')}</h4>
    <p class="help">{$t('onboarding.balances.help')}</p>
  </header>

  <div class="rows">
    {#each $wizard.activeCurrencies as currency (currency)}
      <label class="row">
        <span class="currency">{currency}</span>
        <input
          type="text"
          inputmode="decimal"
          placeholder="0,00"
          value={$wizard.openingBalances[currency] ?? 0}
          oninput={(e) => setBalance(currency, parseAmount((e.target as HTMLInputElement).value))}
        />
      </label>
    {/each}
  </div>
</Card>

<style>
  .head h4 {
    margin: 0 0 var(--space-2);
    font-size: 1rem;
    color: var(--text-primary);
  }
  .help {
    margin: 0 0 var(--space-4);
    color: var(--text-muted);
    font-size: 0.86rem;
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .row {
    display: flex;
    align-items: stretch;
    gap: var(--space-2);
    background: var(--bg-raised);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
  }
  .currency {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    padding: 0 var(--space-3);
    font-weight: 600;
    color: var(--text-secondary);
    background: var(--bg-glass);
    border-right: 1px solid var(--border-subtle);
    font-size: 0.84rem;
  }
  input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-primary);
    padding: var(--space-2) var(--space-3);
    font: inherit;
    min-height: 44px;
    min-width: 0;
  }
  input:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: -2px;
  }
</style>
