<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { theme } from '@/theme';
  import { chartTheme } from '@/lib/charts/theme';
  import type { Palette } from '@/theme';

  // Loose ECharts types — we don't need the full surface to wrap setOption.
  type ECharts = { setOption: (opt: unknown) => void; resize: () => void; dispose: () => void };

  interface Props {
    option: Record<string, unknown>;
    height?: string;
  }

  let { option, height = '240px' }: Props = $props();

  let container: HTMLDivElement | null = $state(null);
  let instance: ECharts | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let reducedMotion = false;

  onMount(async () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    const echarts = await import('echarts');
    if (!container) return;
    instance = echarts.init(container, null, { renderer: 'svg' }) as unknown as ECharts;
    apply($theme);
    resizeObserver = new ResizeObserver(() => instance?.resize());
    resizeObserver.observe(container);
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
    instance?.dispose();
    instance = null;
  });

  function apply(palette: Palette) {
    if (!instance) return;
    instance.setOption({ ...chartTheme(palette, reducedMotion), ...option });
  }

  $effect(() => {
    apply($theme);
  });
</script>

<div bind:this={container} class="chart" style="height: {height}"></div>

<style>
  .chart {
    width: 100%;
    min-height: 120px;
  }
</style>
