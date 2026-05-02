<script lang="ts">
  import Card from '@/components/Card.svelte';
  import BalancePill from '@/components/BalancePill.svelte';
  import { t } from '@/i18n';
  import { formatMoney, convert } from '@/lib/money';
  import { settings, accounts, appStore } from '@/lib/appStore';
  import { accountBalance } from '@/lib/db/accounts';
  import { monthKey as toMonthKey } from '@/lib/db/months';
  import { holdingReturn } from '@/lib/db/investments';
  import type { Currency } from '@/lib/types';

  const currentKey = $derived(toMonthKey(new Date()));

  let perCurrency = $derived.by(() => {
    const out: Record<Currency, number> = {};
    for (const a of $accounts) {
      const bal = accountBalance($appStore, a.id, currentKey);
      out[a.currency] = (out[a.currency] ?? 0) + bal;
    }
    return out;
  });

  let total = $derived.by(() => {
    const rates = $appStore.ratesCache?.rates ?? {};
    let sum = 0;
    for (const [curr, amt] of Object.entries(perCurrency)) {
      const v = convert(amt, curr, $settings.displayCurrency, rates);
      if (Number.isFinite(v)) sum += v;
    }
    for (const h of $appStore.investments.holdings) {
      const r = holdingReturn($appStore, h.id);
      const v = convert(r.marketValue, h.currency, $settings.displayCurrency, rates);
      if (Number.isFinite(v)) sum += v;
    }
    return sum;
  });
</script>

<Card padding="lg" variant="glass">
  <header class="head">
    <span class="label">{$t('overview.networth')}</span>
    <h2>{formatMoney(total, $settings.displayCurrency, $settings.language)}</h2>
  </header>
  <div class="pills">
    {#each Object.entries(perCurrency) as [curr, amt] (curr)}
      <BalancePill
        amount={amt}
        currency={curr}
        convertedAmount={convert(amt, curr, $settings.displayCurrency, $appStore.ratesCache?.rates ?? {})}
        convertedCurrency={$settings.displayCurrency}
        language={$settings.language}
      />
    {/each}
  </div>
</Card>

<style>
  .head {
    margin-bottom: var(--space-3);
  }
  .label {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
  }
  h2 {
    margin: var(--space-1) 0 0;
    font-size: clamp(1.6rem, 1.4rem + 1.5vw, 2.2rem);
    font-weight: 600;
    background: var(--accent-gradient);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
</style>
