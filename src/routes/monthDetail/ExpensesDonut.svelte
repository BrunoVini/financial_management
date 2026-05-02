<script lang="ts">
  import Card from '@/components/Card.svelte';
  import Chart from '@/components/Chart.svelte';
  import { t } from '@/i18n';
  import { formatMoney } from '@/lib/money';
  import { appStore, settings } from '@/lib/appStore';
  import { expensesDonut } from '@/lib/charts/expensesDonut';
  import type { MonthKey } from '@/lib/types';

  interface Props {
    monthKey: MonthKey;
  }

  let { monthKey }: Props = $props();

  let slices = $derived(
    expensesDonut(
      $appStore,
      monthKey,
      $settings.displayCurrency,
      $appStore.ratesCache?.rates ?? {},
    ),
  );

  let option = $derived({
    tooltip: {
      trigger: 'item',
      valueFormatter: (v: number) =>
        formatMoney(Number(v) || 0, $settings.displayCurrency, $settings.language),
    },
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'middle',
      textStyle: { color: 'inherit' },
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '78%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: 'transparent',
          borderWidth: 2,
        },
        label: { show: false },
        data: slices.map((s) => ({
          value: s.value,
          name: s.name,
          itemStyle: { color: s.color },
        })),
      },
    ],
  });
</script>

{#if slices.length > 0}
  <Card title={$t('overview.spent')}>
    <Chart {option} height="240px" />
  </Card>
{/if}
