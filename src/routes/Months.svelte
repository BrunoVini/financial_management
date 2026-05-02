<script lang="ts">
  import { link } from 'svelte-spa-router';
  import { t } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import { appStore, settings } from '@/lib/appStore';
  import { formatMoney } from '@/lib/money';
  import { monthExpenseTotal, monthIncomeTotal } from '@/lib/db/transactions';
  import type { MonthStatus } from '@/lib/types';

  let entries = $derived(
    Object.values($appStore.months).sort((a, b) => b.key.localeCompare(a.key)),
  );

  function statusLabel(status: MonthStatus): string {
    if (status === 'open') return 'Aberto';
    if (status === 'grace') return 'Graça';
    return 'Fechado';
  }

  function spent(key: string): number {
    return monthExpenseTotal(
      $appStore,
      key,
      $settings.displayCurrency,
      $appStore.ratesCache?.rates ?? {},
    );
  }

  function income(key: string): number {
    return monthIncomeTotal(
      $appStore,
      key,
      $settings.displayCurrency,
      $appStore.ratesCache?.rates ?? {},
    );
  }
</script>

<section class="page">
  <h1>{$t('nav.months')}</h1>

  {#if entries.length <= 1}
    <Card padding="md">
      <p class="empty">{$t('months.empty')}</p>
    </Card>
  {/if}

  <ul class="timeline">
    {#each entries as month (month.key)}
      <li>
        <a href={`/months/${month.key}`} use:link class="card-link">
          <Card padding="md" variant="glass">
            <header>
              <h3>{month.key}</h3>
              <span class="badge" data-status={month.status}>{statusLabel(month.status)}</span>
            </header>
            <dl>
              <div>
                <dt>{$t('overview.income')}</dt>
                <dd class="positive">
                  {formatMoney(income(month.key), $settings.displayCurrency, $settings.language)}
                </dd>
              </div>
              <div>
                <dt>{$t('overview.spent')}</dt>
                <dd class="negative">
                  {formatMoney(spent(month.key), $settings.displayCurrency, $settings.language)}
                </dd>
              </div>
              <div>
                <dt>Saldo</dt>
                <dd>
                  {formatMoney(
                    income(month.key) - spent(month.key),
                    $settings.displayCurrency,
                    $settings.language,
                  )}
                </dd>
              </div>
            </dl>
          </Card>
        </a>
      </li>
    {/each}
  </ul>
</section>

<style>
  .page {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: 880px;
  }
  h1 {
    font-size: var(--space-6);
    margin: 0;
  }
  .empty {
    margin: 0;
    color: var(--text-muted);
  }
  .timeline {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .card-link {
    display: block;
    text-decoration: none;
    color: inherit;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-3);
  }
  h3 {
    margin: 0;
    color: var(--text-primary);
  }
  .badge {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    background: var(--bg-glass);
    color: var(--text-secondary);
  }
  .badge[data-status='grace'] {
    color: var(--warning);
  }
  .badge[data-status='closed'] {
    color: var(--text-muted);
  }
  dl {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-2);
    margin: 0;
  }
  @media (max-width: 540px) {
    dl {
      grid-template-columns: 1fr;
    }
  }
  dt {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
  }
  dd {
    margin: 2px 0 0;
    font-variant-numeric: tabular-nums;
  }
  .positive { color: var(--positive); }
  .negative { color: var(--negative); }
</style>
