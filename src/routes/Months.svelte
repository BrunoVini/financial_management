<script lang="ts">
  import { link } from 'svelte-spa-router';
  import { t } from '@/i18n';
  import { appStore, settings } from '@/lib/appStore';
  import { formatMoney } from '@/lib/money';
  import { monthExpenseTotal, monthIncomeTotal } from '@/lib/db/transactions';
  import StatusFilter from '@/components/StatusFilter.svelte';
  import TopBar from './overview/TopBar.svelte';
  import type { MonthStatus } from '@/lib/types';

  let filter = $state<MonthStatus | 'all'>('all');

  let entries = $derived.by(() => {
    const all = Object.values($appStore.months).sort((a, b) => b.key.localeCompare(a.key));
    if (filter === 'all') return all;
    return all.filter((m) => m.status === filter);
  });

  function statusLabel(status: MonthStatus): string {
    if (status === 'open') return $t('months.filter.open');
    if (status === 'grace') return $t('months.filter.grace');
    return $t('months.filter.closed');
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

  function fmt(amt: number): string {
    return formatMoney(amt, $settings.displayCurrency, $settings.language);
  }

  function monthName(key: string): string {
    if (!key) return '';
    const [y, m] = key.split('-').map(Number);
    // Use UTC time-zone explicitly so the rendered month doesn't drift
    // into the previous one in negative-offset locales (BRT etc.).
    return new Intl.DateTimeFormat($settings.language === 'pt-BR' ? 'pt-BR' : $settings.language, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(y, m - 1, 1)));
  }
</script>

<section class="page">
  <TopBar />

  <header class="page-head">
    <h1>{$t('nav.months')}</h1>
    <span class="section-sub">{entries.length === 1 ? '1 mês' : `${entries.length} meses`}</span>
  </header>

  <StatusFilter bind:value={filter} />

  {#if entries.length === 0}
    <div class="empty-card">
      <p>{$t('months.empty')}</p>
    </div>
  {/if}

  <ul class="timeline">
    {#each entries as month (month.key)}
      <li>
        <a href={`/months/${month.key}`} use:link class="card-link">
          <article class="month-card">
            <header class="head">
              <div class="title-block">
                <span class="month-name">{monthName(month.key)}</span>
                <span class="month-key">{month.key}</span>
              </div>
              <span class="badge" data-status={month.status}>{statusLabel(month.status)}</span>
            </header>
            <dl>
              <div>
                <dt>{$t('overview.income')}</dt>
                <dd class="positive">{fmt(income(month.key))}</dd>
              </div>
              <div>
                <dt>{$t('overview.spent')}</dt>
                <dd class="negative">{fmt(spent(month.key))}</dd>
              </div>
              <div>
                <dt>Saldo</dt>
                <dd>{fmt(income(month.key) - spent(month.key))}</dd>
              </div>
            </dl>
          </article>
        </a>
      </li>
    {/each}
  </ul>
</section>

<style>
  .page {
    padding: 56px 48px 96px;
    display: flex; flex-direction: column; gap: 32px;
    max-width: 1100px; margin: 0 auto;
  }
  @media (max-width: 1024px) { .page { padding: 48px 32px 96px; gap: 28px; } }
  @media (max-width: 768px) { .page { padding: 32px 20px 96px; gap: 24px; } }
  @media (max-width: 480px) { .page { padding: 24px 16px 96px; gap: 20px; } }

  .page-head {
    display: flex; justify-content: space-between; align-items: baseline;
    flex-wrap: wrap; gap: var(--space-3); padding-left: 8px;
  }
  h1 {
    margin: 0; font-family: var(--font-display); font-weight: 500;
    font-size: clamp(2rem, 1.8rem + 1vw, 2.6rem);
    letter-spacing: -0.025em; color: var(--text-primary);
  }
  .empty-card {
    background: var(--bg-raised); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xxl); padding: var(--space-6);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset, 0 4px 14px rgba(46, 42, 38, 0.05);
    color: var(--text-muted); font-family: var(--font-display); font-style: italic;
  }
  :global([data-theme='dark']) .empty-card {
    box-shadow: 0 1px 0 rgba(245, 239, 230, 0.04) inset, 0 4px 14px rgba(0, 0, 0, 0.28);
  }
  .timeline { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
  .card-link { display: block; text-decoration: none; color: inherit; transition: transform var(--motion-fast); }
  .card-link:hover { transform: translateY(-1px); }
  .month-card {
    background: var(--bg-raised); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xxl); padding: 22px;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset, 0 4px 14px rgba(46, 42, 38, 0.05);
  }
  :global([data-theme='dark']) .month-card {
    box-shadow: 0 1px 0 rgba(245, 239, 230, 0.04) inset, 0 4px 14px rgba(0, 0, 0, 0.28);
  }
  .head {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: var(--space-3); margin-bottom: var(--space-4);
  }
  .title-block { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .month-name {
    font-family: var(--font-display); font-weight: 500; font-size: 1.4rem;
    letter-spacing: -0.015em; color: var(--text-primary); text-transform: capitalize;
  }
  .month-key { font-family: var(--font-display); font-style: italic; font-size: 0.82rem; color: var(--text-muted); }
  .badge {
    font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em;
    padding: 4px 12px; border-radius: var(--radius-pill);
    background: rgba(124, 148, 116, 0.18); color: var(--positive); flex-shrink: 0;
  }
  .badge[data-status='grace'] { background: rgba(168, 122, 58, 0.20); color: var(--warning); }
  .badge[data-status='closed'] { background: var(--bg-glass); color: var(--text-muted); }
  dl { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); margin: 0; }
  @media (max-width: 540px) { dl { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 360px) { dl { grid-template-columns: 1fr; } }
  dt {
    font-family: var(--font-body); font-size: 0.7rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.18em; color: var(--text-muted);
  }
  dd {
    margin: 4px 0 0; font-family: var(--font-display); font-weight: 500;
    font-size: 1.15rem; letter-spacing: -0.01em; font-variant-numeric: tabular-nums;
  }
  .positive { color: var(--positive); }
  .negative { color: var(--negative); }
</style>
