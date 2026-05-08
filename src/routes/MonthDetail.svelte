<script lang="ts">
  import { router } from 'svelte-spa-router';
  import { t } from '@/i18n';
  import ActivityList from '@/components/ActivityList.svelte';
  import TopBar from './overview/TopBar.svelte';
  import StatCard from './overview/StatCard.svelte';
  import MonthHeader from './monthDetail/MonthHeader.svelte';
  import PendingInstallments from './monthDetail/PendingInstallments.svelte';
  import ExpensesDonut from './monthDetail/ExpensesDonut.svelte';
  import BudgetProgress from './monthDetail/BudgetProgress.svelte';
  import ActivitySearch from './monthDetail/ActivitySearch.svelte';
  import { appStore, mutate, settings } from '@/lib/appStore';
  import { monthActivity } from '@/lib/activity';
  import {
    removeExpense,
    removeIncome,
    removeFxTransfer,
    setSalaryReceived,
    monthExpenseTotal,
    monthIncomeTotal,
  } from '@/lib/db/transactions';
  import { openTransactionModal } from '@/lib/uiStore';
  import { formatMoney } from '@/lib/money';
  import { Plus } from 'lucide-svelte';
  import type { ActivityEntry } from '@/components/ActivityList.svelte';

  function readKey(): string {
    const params = router.params;
    if (params && !Array.isArray(params) && 'key' in params) {
      return (params as Record<string, string>).key ?? '';
    }
    return '';
  }

  let key = $derived(readKey());
  let month = $derived($appStore.months[key]);
  let unlocked = $state(false);
  let locked = $derived(!!month && month.status === 'closed' && !unlocked);

  let allEntries = $derived(month ? monthActivity($appStore, month) : []);
  let searchQuery = $state('');
  let searchCategoryId = $state('');

  let entries = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    return allEntries.filter((entry) => {
      if (q && !entry.label.toLowerCase().includes(q)) return false;
      if (searchCategoryId && entry.kind === 'expense') {
        const expense = month?.expenses.find((e) => e.id === entry.id);
        if (expense?.categoryId !== searchCategoryId) return false;
      }
      return true;
    });
  });

  let spent = $derived(
    month
      ? monthExpenseTotal($appStore, key, $settings.displayCurrency, $appStore.ratesCache?.rates ?? {})
      : 0,
  );
  let income = $derived(
    month
      ? monthIncomeTotal($appStore, key, $settings.displayCurrency, $appStore.ratesCache?.rates ?? {})
      : 0,
  );
  let salary = $derived(month?.salary ?? null);

  function fmt(amt: number): string {
    return formatMoney(amt, $settings.displayCurrency, $settings.language);
  }

  function deleteEntry(entry: ActivityEntry) {
    if (locked) return;
    if (entry.kind === 'expense') mutate((s) => removeExpense(s, key, entry.id));
    else if (entry.kind === 'income') mutate((s) => removeIncome(s, key, entry.id));
    else if (entry.kind === 'fx') mutate((s) => removeFxTransfer(s, key, entry.id));
    else if (entry.kind === 'salary') mutate((s) => setSalaryReceived(s, key, null));
  }

  function pctOfIncome(): string {
    if (income <= 0) return '';
    const p = (spent / income) * 100;
    return `${p.toFixed(1).replace('.', ',')} % da renda`;
  }

  function extrasNote(): string {
    const n = month?.extraIncomes.length ?? 0;
    if (n === 0) return salary ? 'somente salário' : 'sem entradas';
    return n === 1 ? '1 entrada extra' : `${n} entradas extras`;
  }
</script>

{#if !month}
  <section class="page">
    <TopBar />
    <p class="missing">Mês não encontrado.</p>
  </section>
{:else}
  <section class="page">
    <TopBar />

    <MonthHeader {month} {locked} onUnlock={() => (unlocked = true)} />

    <div class="summary">
      {#if salary}
        <StatCard
          tint="sage"
          valueTinted
          label={$t('overview.salary.received')}
          value={fmt(salary.amount)}
          note={`recebido em ${salary.receivedAt.slice(0, 10)}`}
        />
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
        note={extrasNote()}
      />
      <StatCard
        tint="cream"
        label="Saldo livre"
        value={fmt(income - spent)}
        note={income - spent >= 0 ? 'positivo' : 'negativo'}
      />
    </div>

    <PendingInstallments monthKey={key} {locked} />
    <BudgetProgress monthKey={key} />
    <ExpensesDonut monthKey={key} />

    <section class="block">
      <header class="block-head">
        <h2 class="section-title">{$t('overview.activity')}</h2>
        <span class="section-sub">
          {entries.length === 0 ? 'sem lançamentos' : `${entries.length} lançamentos`}
        </span>
      </header>
      <div class="feed">
        <ActivitySearch bind:query={searchQuery} bind:categoryId={searchCategoryId} />
        <ActivityList
          {entries}
          language={$settings.language}
          onDelete={locked ? undefined : deleteEntry}
        />
      </div>
    </section>

    <div class="adders">
      <button type="button" disabled={locked} onclick={() => openTransactionModal('expense')}>
        <Plus size={16} /> {$t('monthDetail.expenses')}
      </button>
      <button type="button" disabled={locked} onclick={() => openTransactionModal('income')}>
        <Plus size={16} /> {$t('monthDetail.incomes')}
      </button>
      <button type="button" disabled={locked} onclick={() => openTransactionModal('fx')}>
        <Plus size={16} /> {$t('monthDetail.fx')}
      </button>
      <button type="button" disabled={locked} onclick={() => openTransactionModal('salary')}>
        <Plus size={16} /> {$t('overview.salary.received')}
      </button>
    </div>
  </section>
{/if}

<style>
  .page {
    padding: 56px 48px 96px;
    display: flex; flex-direction: column; gap: 40px;
    max-width: 1100px; margin: 0 auto;
  }
  @media (max-width: 1024px) { .page { padding: 48px 32px 96px; gap: 32px; } }
  @media (max-width: 768px) { .page { padding: 32px 20px 96px; gap: 28px; } }
  @media (max-width: 480px) { .page { padding: 24px 16px 96px; gap: 24px; } }
  .missing { font-family: var(--font-display); font-style: italic; color: var(--text-muted); }
  .summary { display: grid; gap: 14px; grid-template-columns: repeat(4, 1fr); }
  @media (max-width: 1024px) { .summary { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 480px) { .summary { grid-template-columns: 1fr; } }
  .feed {
    background: var(--bg-raised); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xxl);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset, 0 4px 14px rgba(46, 42, 38, 0.05);
    padding: 8px 24px;
  }
  :global([data-theme='dark']) .feed {
    box-shadow: 0 1px 0 rgba(245, 239, 230, 0.04) inset, 0 4px 14px rgba(0, 0, 0, 0.28);
  }
  @media (max-width: 480px) { .feed { padding: 8px 16px; } }
  .adders { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .adders button {
    background: transparent; color: var(--text-secondary);
    border: 1px dashed var(--border-strong); border-radius: var(--radius-pill);
    padding: 8px var(--space-4); cursor: pointer;
    display: inline-flex; align-items: center; gap: var(--space-2);
    min-height: 38px; font: inherit; font-weight: 500;
    transition: border-color var(--motion-fast), color var(--motion-fast), background var(--motion-fast);
  }
  .adders button:hover:not(:disabled) {
    color: var(--text-primary); border-color: var(--accent-primary);
    background: rgba(124, 148, 116, 0.08);
  }
  .adders button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
