<script lang="ts">
  import { router } from 'svelte-spa-router';
  import { t } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import ActivityList from '@/components/ActivityList.svelte';
  import MonthHeader from './monthDetail/MonthHeader.svelte';
  import PendingInstallments from './monthDetail/PendingInstallments.svelte';
  import ExpensesDonut from './monthDetail/ExpensesDonut.svelte';
  import { appStore, mutate, settings } from '@/lib/appStore';
  import { monthActivity } from '@/lib/activity';
  import {
    removeExpense,
    removeIncome,
    removeFxTransfer,
    setSalaryReceived,
  } from '@/lib/db/transactions';
  import { openTransactionModal } from '@/lib/uiStore';
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

  let entries = $derived(month ? monthActivity($appStore, month) : []);

  function deleteEntry(entry: ActivityEntry) {
    if (locked) return;
    if (entry.kind === 'expense') {
      mutate((s) => removeExpense(s, key, entry.id));
    } else if (entry.kind === 'income') {
      mutate((s) => removeIncome(s, key, entry.id));
    } else if (entry.kind === 'fx') {
      mutate((s) => removeFxTransfer(s, key, entry.id));
    } else if (entry.kind === 'salary') {
      mutate((s) => setSalaryReceived(s, key, null));
    }
  }
</script>

{#if !month}
  <section class="page">
    <p>Mês não encontrado.</p>
  </section>
{:else}
  <section class="page">
    <MonthHeader {month} {locked} onUnlock={() => (unlocked = true)} />

    <PendingInstallments monthKey={key} {locked} />

    <ExpensesDonut monthKey={key} />

    <Card title={$t('overview.activity')}>
      <ActivityList
        {entries}
        language={$settings.language}
        onDelete={locked ? undefined : deleteEntry}
      />
    </Card>

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
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: 880px;
  }
  .adders {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .adders button {
    background: var(--bg-raised);
    color: var(--text-primary);
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 40px;
    font: inherit;
  }
  .adders button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
