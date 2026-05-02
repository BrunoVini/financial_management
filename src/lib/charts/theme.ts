import type { Palette } from '@/theme';

/**
 * Build a partial ECharts option object that applies the active palette
 * to axes, grid, tooltips and default series colors. Components merge
 * this with their own option (axis, series, etc.) before passing to
 * setOption.
 */
export function chartTheme(palette: Palette, reducedMotion = false) {
  return {
    backgroundColor: 'transparent',
    color: [palette.accent.primary, palette.accent.secondary, palette.semantic.info],
    textStyle: {
      color: palette.text.secondary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif',
    },
    grid: {
      left: 8,
      right: 8,
      top: 16,
      bottom: 24,
      containLabel: true,
    },
    tooltip: {
      backgroundColor: palette.bg.raised,
      borderColor: palette.border.strong,
      borderWidth: 1,
      textStyle: { color: palette.text.primary },
      extraCssText: 'border-radius: 8px;',
    },
    xAxis: {
      axisLine: { lineStyle: { color: palette.border.subtle } },
      axisLabel: { color: palette.text.muted, fontSize: 11 },
      splitLine: { show: false },
    },
    yAxis: {
      axisLine: { show: false },
      axisLabel: { color: palette.text.muted, fontSize: 11 },
      splitLine: { lineStyle: { color: palette.border.subtle, type: 'dashed' } },
    },
    animation: !reducedMotion,
  };
}
