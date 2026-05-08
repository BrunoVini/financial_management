<script lang="ts">
  import { t } from '@/i18n';
  import ActivityList from '@/components/ActivityList.svelte';
  import TopBar from './overview/TopBar.svelte';
  import StatCard from './overview/StatCard.svelte';
  import NetWorthCard from './overview/NetWorthCard.svelte';
  import NetWorthHistoryCard from './overview/NetWorthHistoryCard.svelte';
  import InvestmentsPreview from './overview/InvestmentsPreview.svelte';
  import DebtCard from './overview/DebtCard.svelte';
  import BudgetSummaryCard from './overview/BudgetSummaryCard.svelte';
  import { appStore, settings } from '@/lib/appStore';
  import { monthKey as toMonthKey } from '@/lib/db/months';
  import { monthExpenseTotal, monthIncomeTotal } from '@/lib/db/transactions';
  import { holdingReturn } from '@/lib/db/investments';
  import { convert, formatMoney } from '@/lib/money';
  import { monthActivity } from '@/lib/activity';
  import { openTransactionModal } from '@/lib/uiStore';
  import QuickAddFab from '@/components/QuickAddFab.svelte';

  const currentKey = $derived(toMonthKey(new Date()));
  let month = $derived($appStore.months[currentKey]);
  let recent = $derived(month ? monthActivity($appStore, month).slice(0, 8) : []);

  let spent = $derived(
    monthExpenseTotal(
      $appStore,
      currentKey,
      $settings.displayCurrency,
      $appStore.ratesCache?.rates ?? {},
    ),
  );
  let income = $derived(
    monthIncomeTotal(
      $appStore,
      currentKey,
      $settings.displayCurrency,
      $appStore.ratesCache?.rates ?? {},
    ),
  );

  let invested = $derived.by(() => {
    const rates = $appStore.ratesCache?.rates ?? {};
    let sum = 0;
    for (const h of $appStore.investments.holdings) {
      const r = holdingReturn($appStore, h.id);
      const v = convert(r.marketValue, h.currency, $settings.displayCurrency, rates);
      if (Number.isFinite(v)) sum += v;
    }
    return sum;
  });

  let salaryReceived = $derived(month?.salary ?? null);

  function fmt(amt: number): string {
    return formatMoney(amt, $settings.displayCurrency, $settings.language);
  }

  function pctOfIncome(): string {
    if (income <= 0) return '';
    const p = (spent / income) * 100;
    return `${p.toFixed(1).replace('.', ',')} % da renda`;
  }

  function salaryNote(): string {
    if (salaryReceived) return `recebido em ${salaryReceived.receivedAt.slice(0, 10)}`;
    return `dia ${$settings.salaryDayOfMonth}`;
  }

  function holdingsNote(): string {
    const n = $appStore.investments.holdings.length;
    if (n === 0) return 'sem investimentos';
    return n === 1 ? '1 ativo' : `${n} ativos`;
  }
</script>

<section class="page">
  <TopBar />

  <NetWorthCard />

  <div class="summary">
    {#if $settings.salaryAmount > 0}
      <StatCard
        tint="sage"
        valueTinted
        label={salaryReceived ? $t('overview.salary.received') : $t('overview.salary.expected')}
        value={fmt(salaryReceived ? salaryReceived.amount : $settings.salaryAmount)}
        note={salaryNote()}
      >
        {#if !salaryReceived}
          <button
            type="button"
            class="link"
            onclick={() => openTransactionModal('salary')}
          >{$t('overview.salary.markReceived')} →</button>
        {/if}
      </StatCard>
    {/if}
    <StatCard
      tint="rose"
      valueTinted
      label={$t('overview.spent')}
      value={fmt(spent)}
      note={pctOfIncome()}
    />
    <StatCard
      tint="honey"
      valueTinted
      label={$t('overview.income')}
      value={fmt(income)}
      note={month?.extraIncomes.length
        ? `${month.extraIncomes.length} entradas extras`
        : 'somente salário'}
    />
    <StatCard
      tint="cream"
      label={$t('overview.invested')}
      value={fmt(invested)}
      note={holdingsNote()}
    />
  </div>

  <NetWorthHistoryCard />

  <section class="block">
    <header class="block-head">
      <h2 class="section-title">{$t('overview.activity')}</h2>
      <span class="section-sub">
        {recent.length === 0 ? 'sem lançamentos' : `últimos ${recent.length} lançamentos`}
      </span>
    </header>
    <div class="feed">
      <ActivityList entries={recent} language={$settings.language} />
    </div>
  </section>

  <InvestmentsPreview />

  <BudgetSummaryCard />

  <DebtCard />
</section>

<QuickAddFab />

<style>
  .page {
    padding: 56px 48px 96px;
    display: flex;
    flex-direction: column;
    gap: 56px; /* wireframe-style breathing room between sections */
    max-width: 1100px;
    margin: 0 auto;
  }
  /* Tablet — sidebar still visible, drop side padding a bit */
  @media (max-width: 1024px) {
    .page { padding: 48px 32px 96px; gap: 48px; }
  }
  /* Below 768px the sidebar is hidden, BottomNav appears, content
     fills viewport — extra bottom padding clears the BottomNav. */
  @media (max-width: 768px) {
    .page { padding: 32px 20px 96px; gap: 40px; }
  }
  @media (max-width: 480px) {
    .page { padding: 24px 16px 96px; gap: 32px; }
  }
  /* 4-up summary grid — the editorial heart of the page. Each tinted
     card is a discrete reading. Collapses on narrower viewports. */
  .summary {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(4, 1fr);
  }
  @media (max-width: 1024px) {
    .summary { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 480px) {
    .summary { grid-template-columns: 1fr; }
  }
  .link {
    background: transparent;
    border: none;
    padding: 0;
    color: var(--accent-primary);
    font: inherit;
    font-weight: 600;
    font-size: 0.86rem;
    cursor: pointer;
    text-align: left;
    margin-top: 8px;
  }
  .link:hover { text-decoration: underline; }
  /* "Atividade do mês" — single paper card with hairline rows inside.
     Padding is intentionally tight so individual rows breathe. */
  .feed {
    background: var(--bg-raised);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xxl);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.7) inset,
      0 4px 14px rgba(46, 42, 38, 0.05);
    padding: 8px 24px;
  }
  :global([data-theme='dark']) .feed {
    box-shadow:
      0 1px 0 rgba(245, 239, 230, 0.04) inset,
      0 4px 14px rgba(0, 0, 0, 0.28);
  }
</style>
