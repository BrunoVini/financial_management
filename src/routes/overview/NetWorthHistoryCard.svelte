<script lang="ts">
  import Card from '@/components/Card.svelte';
  import Chart from '@/components/Chart.svelte';
  import { t } from '@/i18n';
  import { formatMoney } from '@/lib/money';
  import { appStore, settings } from '@/lib/appStore';
  import { netWorthHistory } from '@/lib/charts/netWorthHistory';

  let series = $derived(netWorthHistory($appStore, $settings.displayCurrency, new Date()));

  let option = $derived({
    grid: { top: 16, bottom: 32, left: 8, right: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v: number) =>
        formatMoney(Number(v) || 0, $settings.displayCurrency, $settings.language),
    },
    xAxis: { type: 'category', boundaryGap: false, data: series.keys },
    yAxis: { type: 'value', scale: true },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 3 },
        areaStyle: { opacity: 0.25 },
        data: series.values,
      },
    ],
  });
</script>

<Card title={$t('inv.history.label')}>
  <Chart {option} height="220px" />
</Card>
