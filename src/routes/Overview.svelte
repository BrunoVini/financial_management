<script lang="ts">
  import { t } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import ActivityList from '@/components/ActivityList.svelte';
  import NetWorthCard from './overview/NetWorthCard.svelte';
  import MonthSummaryCard from './overview/MonthSummaryCard.svelte';
  import SalaryCard from './overview/SalaryCard.svelte';
  import InvestedCard from './overview/InvestedCard.svelte';
  import DebtCard from './overview/DebtCard.svelte';
  import { appStore, settings } from '@/lib/appStore';
  import { monthKey as toMonthKey } from '@/lib/db/months';
  import { monthActivity } from '@/lib/activity';
  import QuickAddFab from '@/components/QuickAddFab.svelte';

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

  <DebtCard />

  <Card title={$t('overview.activity')}>
    <ActivityList entries={recent} language={$settings.language} />
  </Card>
</section>

<QuickAddFab />

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
</style>
