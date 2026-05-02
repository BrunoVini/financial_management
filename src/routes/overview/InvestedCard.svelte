<script lang="ts">
  import Card from '@/components/Card.svelte';
  import { t } from '@/i18n';
  import { formatMoney, convert } from '@/lib/money';
  import { appStore, settings } from '@/lib/appStore';
  import { holdingReturn } from '@/lib/db/investments';

  let totalInvested = $derived.by(() => {
    const rates = $appStore.ratesCache?.rates ?? {};
    let sum = 0;
    for (const h of $appStore.investments.holdings) {
      const r = holdingReturn($appStore, h.id);
      const v = convert(r.marketValue, h.currency, $settings.displayCurrency, rates);
      if (Number.isFinite(v)) sum += v;
    }
    return sum;
  });
</script>

<Card padding="md" title={$t('overview.invested')}>
  <p class="value">{formatMoney(totalInvested, $settings.displayCurrency, $settings.language)}</p>
  <p class="meta">{$appStore.investments.holdings.length} positions</p>
</Card>

<style>
  .value {
    margin: 0;
    font-size: 1.25rem;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }
  .meta {
    margin: var(--space-1) 0 0;
    color: var(--text-muted);
    font-size: 0.82rem;
  }
</style>
