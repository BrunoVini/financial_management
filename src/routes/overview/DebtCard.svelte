<script lang="ts">
  import Card from '@/components/Card.svelte';
  import { t } from '@/i18n';
  import { formatMoney } from '@/lib/money';
  import { appStore, settings } from '@/lib/appStore';
  import { totalUpcomingDebt, perInstallmentAmount } from '@/lib/db/installments';

  let total = $derived(
    totalUpcomingDebt(
      $appStore,
      $settings.displayCurrency,
      $appStore.ratesCache?.rates ?? {},
    ),
  );

  let pendingCount = $derived.by(() => {
    let n = 0;
    for (const plan of $appStore.installments) {
      n += plan.installmentCount - plan.paidIndices.length;
    }
    return n;
  });
</script>

{#if $appStore.installments.length > 0 && pendingCount > 0}
  <Card padding="md" title={$t('inst.overview.label')}>
    <p class="value negative">
      − {formatMoney(total, $settings.displayCurrency, $settings.language)}
    </p>
    <p class="meta">{$t('inst.overview.count').replace('{count}', String(pendingCount))}</p>
    <ul class="plans">
      {#each $appStore.installments as plan (plan.id)}
        {@const pending = plan.installmentCount - plan.paidIndices.length}
        {#if pending > 0}
          <li>
            <span class="desc">{plan.description}</span>
            <span class="parc">
              {pending}/{plan.installmentCount} ·
              {formatMoney(perInstallmentAmount(plan), plan.currency, $settings.language)}
            </span>
          </li>
        {/if}
      {/each}
    </ul>
  </Card>
{/if}

<style>
  .value {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 1.7rem;
    letter-spacing: -0.02em;
    color: var(--negative);
    font-variant-numeric: tabular-nums;
  }
  .meta {
    margin: 6px 0 var(--space-4);
    font-family: var(--font-display);
    font-style: italic;
    color: var(--text-muted);
    font-size: 0.86rem;
  }
  .plans {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
  }
  li {
    display: flex;
    justify-content: space-between;
    gap: var(--space-2);
    padding: 12px var(--space-2);
    border-bottom: 1px solid var(--border-subtle);
    font-size: 0.92rem;
  }
  li:last-child { border-bottom: none; }
  .desc {
    color: var(--text-primary);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .parc {
    font-family: var(--font-display);
    font-style: italic;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }
</style>
