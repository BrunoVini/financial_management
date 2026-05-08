<script lang="ts">
  import Card from '@/components/Card.svelte';
  import Chart from '@/components/Chart.svelte';
  import { t } from '@/i18n';
  import { formatMoney, convert } from '@/lib/money';
  import { appStore, settings, mutate } from '@/lib/appStore';
  import { addSnapshot, holdingReturn } from '@/lib/db/investments';
  import { holdingSparkline } from '@/lib/charts/investmentSeries';
  import { refreshCryptoSnapshot } from '@/lib/db/cryptoActions';
  import { refreshStockSnapshot } from '@/lib/db/stockActions';
  import { ensureCdi } from '@/lib/bcbRates';
  import { hasYield } from '@/lib/db/yieldEngine';
  import CoinAmountLine from './CoinAmountLine.svelte';
  import ShareAmountLine from './ShareAmountLine.svelte';
  import { Plus, Camera, RefreshCw, TrendingUp } from 'lucide-svelte';
  import type { Holding } from '@/lib/types';

  interface Props {
    holding: Holding;
    onContribute: () => void;
    onSnapshot: () => void;
  }

  let { holding, onContribute, onSnapshot }: Props = $props();
  let refreshing = $state(false);
  let refreshError = $state<string | null>(null);

  async function refreshPrice() {
    refreshing = true;
    refreshError = null;
    if (holding.coinId) {
      const result = await refreshCryptoSnapshot(holding, $appStore.cryptoCache);
      if (result.cache) {
        const fresh = result.cache;
        mutate((s) => ({ ...s, cryptoCache: fresh }));
      }
      if (result.snapshot) mutate((s) => addSnapshot(s, result.snapshot!));
      if (result.errorKey) refreshError = $t(result.errorKey);
    } else if (holding.ticker) {
      const result = await refreshStockSnapshot(holding, $appStore.stockCache);
      if (result.cache) {
        const fresh = result.cache;
        mutate((s) => ({ ...s, stockCache: fresh }));
      }
      if (result.snapshot) mutate((s) => addSnapshot(s, result.snapshot!));
      if (result.errorKey) refreshError = $t(result.errorKey);
    }
    refreshing = false;
  }

  async function refreshCdi() {
    refreshing = true;
    refreshError = null;
    try {
      const result = await ensureCdi($appStore.bcbCache);
      if (result.cache) {
        const fresh = result.cache;
        mutate((s) => ({ ...s, bcbCache: fresh }));
      }
    } catch {
      refreshError = $t('inv.yield.cdiUnavailable');
    }
    refreshing = false;
  }

  let summary = $derived(holdingReturn($appStore, holding.id));
  let series = $derived(holdingSparkline($appStore, holding.id));

  let convertedValue = $derived(
    convert(
      summary.marketValue,
      holding.currency,
      $settings.displayCurrency,
      $appStore.ratesCache?.rates ?? {},
    ),
  );

  let chartOption = $derived({
    grid: { top: 4, bottom: 4, left: 4, right: 4 },
    xAxis: { type: 'category', show: false, data: series.map((p) => p.takenAt) },
    yAxis: { type: 'value', show: false, scale: true },
    tooltip: { show: false },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.18 },
        data: series.map((p) => p.marketValue),
      },
    ],
  });
</script>

<Card padding="md">
  <header class="head">
    <div class="title">
      <h3>{holding.name}</h3>
      <span class="type">{holding.type}</span>
      {#if holding.coinId}<CoinAmountLine {holding} />{/if}
      {#if holding.ticker}<ShareAmountLine {holding} />{/if}
      {#if hasYield(holding)}
        <span class="yield-tag">
          {holding.yieldType === 'cdi'
            ? `${((holding.yieldRate ?? 0) * 100).toFixed(0)}% CDI`
            : `${((holding.yieldRate ?? 0) * 100).toFixed(2)}% a.a.`}
        </span>
      {/if}
    </div>
    <div class="value">
      <strong>{formatMoney(summary.marketValue, holding.currency, $settings.language)}</strong>
      {#if Number.isFinite(convertedValue) && holding.currency !== $settings.displayCurrency}
        <span class="conv">≈ {formatMoney(convertedValue, $settings.displayCurrency, $settings.language)}</span>
      {/if}
    </div>
  </header>

  {#if series.length >= 2}
    <Chart option={chartOption} height="80px" />
  {/if}

  <dl class="stats">
    <div>
      <dt>{$t('inv.contributed')}</dt>
      <dd>{formatMoney(summary.contributed, holding.currency, $settings.language)}</dd>
    </div>
    <div>
      <dt>{$t('inv.return')}</dt>
      <dd class:positive={summary.deltaAbsolute >= 0} class:negative={summary.deltaAbsolute < 0}>
        {summary.deltaAbsolute >= 0 ? '+' : ''}{formatMoney(summary.deltaAbsolute, holding.currency, $settings.language)}
        <span class="pct">({summary.deltaPercent.toFixed(2)}%)</span>
      </dd>
    </div>
  </dl>

  <div class="actions">
    <button type="button" onclick={onContribute}>
      <Plus size={14} /> {$t('inv.contribute.button')}
    </button>
    {#if holding.coinId}
      <button type="button" onclick={refreshPrice} disabled={refreshing}>
        <RefreshCw size={14} /> {$t('inv.crypto.refresh')}
      </button>
    {:else if holding.ticker}
      <button type="button" onclick={refreshPrice} disabled={refreshing}>
        <RefreshCw size={14} /> {$t('inv.stock.refresh')}
      </button>
    {:else if hasYield(holding) && holding.yieldType === 'cdi'}
      <button type="button" onclick={refreshCdi} disabled={refreshing}>
        <TrendingUp size={14} /> {$t('inv.yield.refresh')}
      </button>
    {:else}
      <button type="button" onclick={onSnapshot}>
        <Camera size={14} /> {$t('inv.snapshot.button')}
      </button>
    {/if}
  </div>
  {#if refreshError}<p class="error" role="alert">{refreshError}</p>{/if}
</Card>

<style>
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-3); margin-bottom: var(--space-4); }
  .title h3 { margin: 0; font-family: var(--font-display); font-weight: 500; font-size: 1.25rem; letter-spacing: -0.01em; color: var(--text-primary); }
  .type { font-family: var(--font-display); font-style: italic; font-size: 0.78rem; color: var(--text-muted); }
  .yield-tag { display: inline-block; margin-top: 4px; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em; color: var(--accent-primary); background: rgba(124, 148, 116, 0.16); padding: 2px 8px; border-radius: var(--radius-pill); }
  .error { color: var(--negative); font-size: 0.82rem; font-style: italic; font-family: var(--font-display); margin: var(--space-2) 0 0; }
  .value { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
  .value strong { font-family: var(--font-display); font-weight: 500; font-size: 1.3rem; letter-spacing: -0.015em; font-variant-numeric: tabular-nums; }
  .conv { font-family: var(--font-display); font-style: italic; font-size: 0.82rem; color: var(--text-muted); }
  .stats { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin: var(--space-4) 0; }
  dt { font-family: var(--font-body); font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; color: var(--text-muted); }
  dd { margin: 6px 0 0; font-family: var(--font-display); font-weight: 500; font-size: 1rem; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
  .pct { font-style: italic; font-size: 0.86em; opacity: 0.85; }
  .positive { color: var(--positive); }
  .negative { color: var(--negative); }
  .actions { display: flex; gap: var(--space-2); }
  .actions button {
    flex: 1; background: var(--bg-glass); color: var(--text-primary);
    border: 1px solid var(--border-subtle); border-radius: var(--radius-pill);
    padding: 8px var(--space-3); cursor: pointer; display: inline-flex;
    align-items: center; justify-content: center; gap: var(--space-2);
    font: inherit; font-weight: 500; min-height: 38px;
    transition: border-color var(--motion-fast), color var(--motion-fast);
  }
  .actions button:hover:not(:disabled) {
    border-color: var(--accent-primary); color: var(--accent-primary);
  }
</style>
