<script lang="ts">
  import Card from '@/components/Card.svelte';
  import { t } from '@/i18n';
  import { formatMoney } from '@/lib/money';
  import { appStore, settings } from '@/lib/appStore';
  import { monthKey as toMonthKey } from '@/lib/db/months';
  import { openTransactionModal } from '@/lib/uiStore';

  const currentKey = $derived(toMonthKey(new Date()));
  let month = $derived($appStore.months[currentKey]);
  let received = $derived(month?.salary ?? null);
</script>

{#if $settings.salaryAmount > 0}
  <Card padding="md" title={received ? $t('overview.salary.received') : $t('overview.salary.expected')}>
    {#if received}
      <p class="value">
        {formatMoney(received.amount, received.currency, $settings.language)}
      </p>
      <p class="meta">
        {received.receivedAt.slice(0, 10)} · {$t('tx.salary.rate')}
        {received.rateToDisplay.toFixed(4)}
      </p>
    {:else}
      <p class="value">
        {formatMoney($settings.salaryAmount, $settings.salaryCurrency, $settings.language)}
      </p>
      <p class="meta">Day {$settings.salaryDayOfMonth}</p>
      <button type="button" class="primary" onclick={() => openTransactionModal('salary')}>
        {$t('overview.salary.markReceived')}
      </button>
    {/if}
  </Card>
{/if}

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
  .primary {
    margin-top: var(--space-3);
    background: var(--accent-gradient);
    color: white;
    border: none;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    cursor: pointer;
    min-height: 40px;
  }
</style>
