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
    // Pastoral series palette: sage → rose → honey → dusty blue → muted ink.
    // Lifts the chart out of the SaaS palette and into the Apothecary world.
    color: [
      palette.accent.primary,
      palette.accent.secondary,
      palette.semantic.warning,
      palette.semantic.info,
      palette.text.secondary,
    ],
    textStyle: {
      color: palette.text.secondary,
      fontFamily:
        "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
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
      borderColor: palette.border.subtle,
      borderWidth: 1,
      textStyle: { color: palette.text.primary, fontWeight: 500 },
      extraCssText:
        'border-radius: 14px; box-shadow: 0 6px 22px rgba(46,42,38,0.14); padding: 10px 14px;',
    },
    xAxis: {
      axisLine: { lineStyle: { color: palette.border.subtle } },
      // Use text.secondary so axis labels read on both light and dark
      // pastoral backgrounds (text.muted is too low-contrast on dark).
      axisLabel: { color: palette.text.secondary, fontSize: 11 },
      splitLine: { show: false },
    },
    yAxis: {
      axisLine: { show: false },
      axisLabel: { color: palette.text.secondary, fontSize: 11 },
      splitLine: { lineStyle: { color: palette.border.subtle, type: 'dashed' } },
    },
    animation: !reducedMotion,
  };
}
