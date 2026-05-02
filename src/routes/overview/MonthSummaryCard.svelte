<script lang="ts">
  import Card from '@/components/Card.svelte';
  import { t } from '@/i18n';
  import { formatMoney } from '@/lib/money';
  import { appStore, settings } from '@/lib/appStore';
  import { monthKey as toMonthKey } from '@/lib/db/months';
  import { monthExpenseTotal, monthIncomeTotal } from '@/lib/db/transactions';

  const currentKey = $derived(toMonthKey(new Date()));

  let spent = $derived(
    monthExpenseTotal($appStore, currentKey, $settings.displayCurrency, $appStore.ratesCache?.rates ?? {}),
  );
  let income = $derived(
    monthIncomeTotal($appStore, currentKey, $settings.displayCurrency, $appStore.ratesCache?.rates ?? {}),
  );
  let free = $derived(income - spent);
</script>

<Card padding="md" variant="glass">
  <div class="row">
    <div>
      <span class="label">{$t('overview.spent')}</span>
      <strong class="value negative">
        {formatMoney(spent, $settings.displayCurrency, $settings.language)}
      </strong>
    </div>
    <div>
      <span class="label">{$t('overview.income')}</span>
      <strong class="value positive">
        {formatMoney(income, $settings.displayCurrency, $settings.language)}
      </strong>
    </div>
    <div>
      <span class="label">Saldo livre</span>
      <strong class="value" class:negative={free < 0} class:positive={free >= 0}>
        {formatMoney(free, $settings.displayCurrency, $settings.language)}
      </strong>
    </div>
  </div>
</Card>

<style>
  .row {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 600px) {
    .row {
      grid-template-columns: 1fr;
    }
  }
  .label {
    display: block;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
  }
  .value {
    display: block;
    font-size: 1.15rem;
    margin-top: var(--space-1);
    font-variant-numeric: tabular-nums;
  }
  .positive { color: var(--positive); }
  .negative { color: var(--negative); }
</style>
