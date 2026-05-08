<script lang="ts">
  import { t } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import Chart from '@/components/Chart.svelte';
  import HoldingCard from './investments/HoldingCard.svelte';
  import ContributionModal from './investments/ContributionModal.svelte';
  import SnapshotModal from './investments/SnapshotModal.svelte';
  import NewHoldingModal from './investments/NewHoldingModal.svelte';
  import { appStore, settings } from '@/lib/appStore';
  import { investmentSeries } from '@/lib/charts/investmentSeries';
  import { formatMoney } from '@/lib/money';
  import { Plus, Camera, Wallet } from 'lucide-svelte';

  let contribOpen = $state(false);
  let snapOpen = $state(false);
  let newHoldingOpen = $state(false);
  let presetHoldingId = $state<string | undefined>(undefined);

  function openContribute(id?: string) {
    presetHoldingId = id;
    contribOpen = true;
  }
  function openSnapshot(id?: string) {
    presetHoldingId = id;
    snapOpen = true;
  }
  function closeAll() {
    contribOpen = false;
    snapOpen = false;
    presetHoldingId = undefined;
  }

  let series = $derived(
    investmentSeries(
      $appStore,
      $settings.displayCurrency,
      $appStore.ratesCache?.rates ?? {},
    ),
  );

  let chartOption = $derived({
    legend: { textStyle: { color: 'inherit' } },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v: number) =>
        formatMoney(Number(v) || 0, $settings.displayCurrency, $settings.language),
    },
    xAxis: { type: 'category', data: series.keys, boundaryGap: false },
    yAxis: { type: 'value', scale: true },
    series: [
      {
        name: $t('inv.contributed'),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: series.contributions,
        lineStyle: { width: 2 },
      },
      {
        name: $t('inv.value'),
        type: 'line',
        smooth: true,
        symbol: 'none',
        areaStyle: { opacity: 0.25 },
        data: series.marketValue,
        lineStyle: { width: 3 },
      },
    ],
  });
</script>

<section class="page">
  <header class="page-head">
    <h1>{$t('nav.investments')}</h1>
    <div class="quick">
      <button type="button" onclick={() => (newHoldingOpen = true)}>
        <Wallet size={16} /> {$t('inv.add.button')}
      </button>
      <button type="button" onclick={() => openContribute()}>
        <Plus size={16} /> {$t('inv.contribute.button')}
      </button>
      <button type="button" onclick={() => openSnapshot()}>
        <Camera size={16} /> {$t('inv.snapshot.button')}
      </button>
    </div>
  </header>

  {#if $appStore.investments.holdings.length === 0}
    <Card padding="lg">
      <p class="empty">{$t('inv.empty')}</p>
    </Card>
  {:else}
    {#if series.keys.length >= 2}
      <Card title={$t('inv.combined.label')}>
        <Chart option={chartOption} height="280px" />
      </Card>
    {/if}

    <div class="grid">
      {#each $appStore.investments.holdings as h (h.id)}
        <HoldingCard
          holding={h}
          onContribute={() => openContribute(h.id)}
          onSnapshot={() => openSnapshot(h.id)}
        />
      {/each}
    </div>
  {/if}
</section>

<ContributionModal open={contribOpen} onclose={closeAll} {presetHoldingId} />
<SnapshotModal open={snapOpen} onclose={closeAll} {presetHoldingId} />
<NewHoldingModal open={newHoldingOpen} onclose={() => (newHoldingOpen = false)} />

<style>
  .page {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: 1080px;
  }
  .page-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
  h1 {
    font-size: var(--space-6);
    margin: 0;
  }
  .quick {
    display: flex;
    gap: var(--space-2);
  }
  .quick button {
    background: var(--accent-gradient);
    color: white;
    border: none;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 40px;
    font: inherit;
  }
  .empty {
    margin: 0;
    color: var(--text-secondary);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-3);
  }
</style>
