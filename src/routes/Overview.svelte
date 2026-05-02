<script lang="ts">
  import { t } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import ActivityList from '@/components/ActivityList.svelte';
  import NetWorthCard from './overview/NetWorthCard.svelte';
  import MonthSummaryCard from './overview/MonthSummaryCard.svelte';
  import SalaryCard from './overview/SalaryCard.svelte';
  import InvestedCard from './overview/InvestedCard.svelte';
  import { appStore, settings } from '@/lib/appStore';
  import { monthKey as toMonthKey } from '@/lib/db/months';
  import { monthActivity } from '@/lib/activity';
  import { openTransactionModal } from '@/lib/uiStore';
  import { Plus } from 'lucide-svelte';

  const currentKey = $derived(toMonthKey(new Date()));
  let month = $derived($appStore.months[currentKey]);
  let recent = $derived(month ? monthActivity($appStore, month).slice(0, 10) : []);
</script>

<section class="page">
  <h1>{$t('nav.overview')}</h1>

  <NetWorthCard />

  <div class="grid">
    <MonthSummaryCard />
    <SalaryCard />
    <InvestedCard />
  </div>

  <Card title={$t('overview.activity')}>
    <ActivityList entries={recent} language={$settings.language} />
  </Card>
</section>

<button
  type="button"
  class="fab"
  aria-label={$t('overview.fab.label')}
  onclick={() => openTransactionModal('expense')}
>
  <Plus size={24} />
</button>

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
  .grid {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 700px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
  .fab {
    position: fixed;
    bottom: 96px;
    right: var(--space-4);
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--accent-gradient);
    color: white;
    border: none;
    box-shadow: var(--shadow-glow), var(--shadow-glass);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
  }
  @media (min-width: 769px) {
    .fab {
      bottom: var(--space-5);
    }
  }
</style>
