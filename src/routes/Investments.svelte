<script lang="ts">
  import { t } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import Chart from '@/components/Chart.svelte';
  import HoldingCard from './investments/HoldingCard.svelte';
  import ContributionModal from './investments/ContributionModal.svelte';
  import SnapshotModal from './investments/SnapshotModal.svelte';
  import NewHoldingModal from './investments/NewHoldingModal.svelte';
  import TopBar from './overview/TopBar.svelte';
  import StatCard from './overview/StatCard.svelte';
  import { appStore, settings } from '@/lib/appStore';
  import { investmentSeries } from '@/lib/charts/investmentSeries';
  import { holdingReturn } from '@/lib/db/investments';
  import { convert, formatMoney } from '@/lib/money';
  import { Plus, Camera, Wallet } from 'lucide-svelte';

  let contribOpen = $state(false);
  let snapOpen = $state(false);
  let newHoldingOpen = $state(false);
  let presetHoldingId = $state<string | undefined>(undefined);

  function openContribute(id?: string) { presetHoldingId = id; contribOpen = true; }
  function openSnapshot(id?: string) { presetHoldingId = id; snapOpen = true; }
  function closeAll() { contribOpen = false; snapOpen = false; presetHoldingId = undefined; }

  let series = $derived(
    investmentSeries(
      $appStore,
      $settings.displayCurrency,
      $appStore.ratesCache?.rates ?? {},
    ),
  );

  // Aggregate KPIs across all holdings — feed the hero summary cards.
  let kpis = $derived.by(() => {
    const rates = $appStore.ratesCache?.rates ?? {};
    let market = 0;
    let contributed = 0;
    for (const h of $appStore.investments.holdings) {
      const r = holdingReturn($appStore, h.id);
      const m = convert(r.marketValue, h.currency, $settings.displayCurrency, rates);
      const c = convert(r.contributed, h.currency, $settings.displayCurrency, rates);
      if (Number.isFinite(m)) market += m;
      if (Number.isFinite(c)) contributed += c;
    }
    const delta = market - contributed;
    const pct = contributed > 0 ? (delta / contributed) * 100 : 0;
    return { market, contributed, delta, pct };
  });

  function fmt(amt: number): string {
    return formatMoney(amt, $settings.displayCurrency, $settings.language);
  }

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
      { name: $t('inv.contributed'), type: 'line', smooth: true, symbol: 'circle',
        symbolSize: 6, data: series.contributions, lineStyle: { width: 2 } },
      { name: $t('inv.value'), type: 'line', smooth: true, symbol: 'none',
        areaStyle: { opacity: 0.25 }, data: series.marketValue, lineStyle: { width: 3 } },
    ],
  });

  let n = $derived($appStore.investments.holdings.length);
</script>

<section class="page">
  <TopBar />

  <header class="page-head">
    <div class="title-block">
      <h1>{$t('nav.investments')}</h1>
      <span class="section-sub">
        {n === 0 ? 'sem ativos' : n === 1 ? '1 ativo' : `${n} ativos`}
      </span>
    </div>
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
    <div class="empty-card">
      <p>{$t('inv.empty')}</p>
    </div>
  {:else}
    <div class="kpis">
      <StatCard
        tint="cream"
        label="Valor de mercado"
        value={fmt(kpis.market)}
        note={`${n === 1 ? '1 posição' : `${n} posições`}`}
      />
      <StatCard
        tint="sage"
        label={$t('inv.contributed')}
        value={fmt(kpis.contributed)}
        note="total aportado"
      />
      <StatCard
        tint={kpis.delta >= 0 ? 'sage' : 'rose'}
        valueTinted
        label={$t('inv.return')}
        value={`${kpis.delta >= 0 ? '+' : ''}${fmt(kpis.delta)}`}
        note={`${kpis.pct >= 0 ? '+' : ''}${kpis.pct.toFixed(1).replace('.', ',')} %`}
      />
    </div>

    {#if series.keys.length >= 2}
      <section class="block">
        <header class="block-head">
          <h2 class="section-title">{$t('inv.combined.label')}</h2>
        </header>
        <Card padding="md">
          <Chart option={chartOption} height="280px" />
        </Card>
      </section>
    {/if}

    <section class="block">
      <header class="block-head">
        <h2 class="section-title">Posições</h2>
        <span class="section-sub">{n === 1 ? '1 ativo' : `${n} ativos`}</span>
      </header>
      <div class="grid">
        {#each $appStore.investments.holdings as h (h.id)}
          <HoldingCard
            holding={h}
            onContribute={() => openContribute(h.id)}
            onSnapshot={() => openSnapshot(h.id)}
          />
        {/each}
      </div>
    </section>
  {/if}
</section>

<ContributionModal open={contribOpen} onclose={closeAll} {presetHoldingId} />
<SnapshotModal open={snapOpen} onclose={closeAll} {presetHoldingId} />
<NewHoldingModal open={newHoldingOpen} onclose={() => (newHoldingOpen = false)} />

<style>
  .page {
    padding: 56px 48px 96px;
    display: flex; flex-direction: column; gap: 40px;
    max-width: 1100px; margin: 0 auto;
  }
  @media (max-width: 1024px) { .page { padding: 48px 32px 96px; gap: 32px; } }
  @media (max-width: 768px) { .page { padding: 32px 20px 96px; gap: 28px; } }
  @media (max-width: 480px) { .page { padding: 24px 16px 96px; gap: 24px; } }
  .page-head {
    display: flex; justify-content: space-between; align-items: flex-end;
    flex-wrap: wrap; gap: var(--space-4); padding-left: 8px;
  }
  .title-block { display: flex; flex-direction: column; gap: 6px; }
  h1 {
    margin: 0; font-family: var(--font-display); font-weight: 500;
    font-size: clamp(2rem, 1.8rem + 1vw, 2.6rem);
    letter-spacing: -0.025em; color: var(--text-primary);
  }
  .quick { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  .quick button {
    background: var(--accent-gradient); color: white; border: none;
    padding: 10px var(--space-5); border-radius: var(--radius-pill); cursor: pointer;
    display: inline-flex; align-items: center; gap: var(--space-2); min-height: 40px;
    font: inherit; font-weight: 600;
    box-shadow: 0 4px 14px rgba(124, 148, 116, 0.22);
    transition: transform var(--motion-fast), box-shadow var(--motion-fast);
  }
  .quick button:hover {
    transform: translateY(-1px); box-shadow: 0 6px 18px rgba(124, 148, 116, 0.3);
  }
  .empty-card {
    background: var(--bg-raised); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xxl); padding: var(--space-7); text-align: center;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset, 0 4px 14px rgba(46, 42, 38, 0.05);
  }
  :global([data-theme='dark']) .empty-card {
    box-shadow: 0 1px 0 rgba(245, 239, 230, 0.04) inset, 0 4px 14px rgba(0, 0, 0, 0.28);
  }
  .empty-card p { margin: 0; font-family: var(--font-display); font-style: italic; color: var(--text-muted); }
  .kpis { display: grid; gap: 14px; grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 880px) { .kpis { grid-template-columns: 1fr; } }
  .grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px;
  }
  @media (max-width: 480px) { .grid { grid-template-columns: 1fr; gap: 14px; } }
</style>
