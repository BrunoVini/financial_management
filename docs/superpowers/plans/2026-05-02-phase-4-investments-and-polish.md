# Phase 4 — Investments UI + Charts + Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the loop on the spec — Investments page with combined contributions vs market-value chart, per-holding cards with sparklines and return numbers, contribute/snapshot flows, net-worth chart on Overview, expense donut on MonthDetail, command palette, polish (a11y + reduced motion).

**Architecture:** Apache ECharts via a single `<Chart>` wrapper, lazy-loaded per route (`import('echarts')` so it doesn't bloat the Overview bundle). Theme tokens drive series colors. New `db/investments` modal flows reuse the existing `Modal` primitive.

**Conventions inherited from Phases 1-3:** English code, ≤200 lines per file, Given/When/Then comments in tests, `@/` alias, tests mirror `src/` structure, push to `origin/main` after every task, CHANGELOG entry per task.

---

## File Structure (Phase 4 outputs)

```
src/
  components/
    Chart.svelte                       # ECharts wrapper, lazy import
    CommandPalette.svelte              # cmd/ctrl+k navigation
  lib/
    charts/
      theme.ts                         # ECharts theme derived from theme tokens
      netWorthHistory.ts               # 12-month series builder (TDD)
      expensesDonut.ts                 # category totals -> donut series (TDD)
      investmentSeries.ts              # per-holding + combined series builders (TDD)
  routes/
    investments/
      ContributionModal.svelte
      SnapshotModal.svelte
      HoldingCard.svelte
    Investments.svelte                 # full page (replaces placeholder)
    overview/
      NetWorthHistoryCard.svelte       # 12-month area chart on Overview
    monthDetail/
      ExpensesDonut.svelte             # by-category donut on MonthDetail
tests/
  lib/
    charts/
      netWorthHistory.test.ts
      expensesDonut.test.ts
      investmentSeries.test.ts
```

---

## Task 1: ECharts wrapper + theme

**Files:** `src/components/Chart.svelte`, `src/lib/charts/theme.ts`

Behavior:
- `<Chart option={...} height="240px" />` mounts ECharts on a container `<div>` and applies `option`. Updates ECharts when `option` changes via `$effect`.
- Lazy-load `echarts` with `import('echarts')` inside `onMount` so the chunk only ships on routes that actually render charts.
- `theme.ts` exposes `chartTheme(palette: Palette)` — returns ECharts options merged with axis/text/grid colors derived from current theme tokens (text colors, accent gradient stops for series, semantic positive/negative).
- `Chart.svelte` reads the active palette via the `theme` store and re-applies the merged option whenever it changes.
- Honors `prefers-reduced-motion`: pass `animation: false` when the media query matches.

No new tests for the wrapper itself (DOM-heavy); pure helpers below get tested.

---

## Task 2: Series builders (TDD)

**Files:**
- `src/lib/charts/netWorthHistory.ts` (+ test)
- `src/lib/charts/expensesDonut.ts` (+ test)
- `src/lib/charts/investmentSeries.ts` (+ test)

`netWorthHistory(store, displayCurrency, today)`:
- Returns last 12 months of net worth in display currency.
- For each month: sum `accountBalance(store, accountId, monthKey)` (already folds transactions) converted via the live rates cache + sum of holding `marketValue` from latest snapshot ≤ that month, also converted.
- Output: `{ keys: string[]; values: number[] }`.
- Months that don't exist yet anchor at the most recent known total (so the chart doesn't drop to zero in gaps).

`expensesDonut(store, monthKey, displayCurrency)`:
- Per category with non-zero spend, return `{ name, value, color }`.
- `value` is converted to display currency (live rates).
- Empty array when no expenses.

`investmentSeries(store, displayCurrency)`:
- For the combined chart: `{ keys: string[] /* monthKeys ascending */, contributions: number[], marketValue: number[] }` over all months that have any contribution or snapshot.
- For per-holding sparkline: `holdingSparkline(store, holdingId)` returns `{ takenAt: string; marketValue: number }[]` sorted asc.

Tests cover empty states, mixed currencies, gap handling, multiple holdings.

---

## Task 3: ContributionModal

**Files:** `src/routes/investments/ContributionModal.svelte`

Form: pick holding (select), amount + currency (`MoneyInput`, defaults to holding's currency), date (default today). Validates amount > 0 and a holding is selected. Persists via `addContribution(store, { holdingId, monthKey: derived from date, amount, currency, date })`.

---

## Task 4: SnapshotModal

`src/routes/investments/SnapshotModal.svelte`. Form: pick holding, market value + currency (defaults to holding's), `takenAt` (datetime-local). Persists via `addSnapshot(...)`. Validates value ≥ 0 and holding selected. (Allow 0 in case a position lost everything.)

---

## Task 5: HoldingCard

`src/routes/investments/HoldingCard.svelte` — for one holding shows: name, type label, current `marketValue` in native currency + converted, `holdingReturn(store, id)` (absolute + %), tiny sparkline (mini ECharts via `Chart`). Buttons: "Aporte" → opens ContributionModal pre-filled with this holding; "Atualizar valor" → opens SnapshotModal pre-filled.

---

## Task 6: Investments page

`src/routes/Investments.svelte` (replaces placeholder). Sections:
1. Combined chart card: cumulative contributions (line) vs market value (area gradient).
2. Grid of `HoldingCard` (one per holding).
3. Empty state when no holdings.
4. Top-right buttons "+ Aporte" and "Snapshot" open the two modals (no holding pre-selected).

Modals are rendered in `App.svelte` along with the existing transaction modals (or kept local — implementation choice; keeping in App keeps the global pattern consistent).

---

## Task 7: NetWorthHistoryCard on Overview

`src/routes/overview/NetWorthHistoryCard.svelte` — area chart of the last 12 months. Add to Overview between `NetWorthCard` and the summary grid. Card title "Patrimônio (12 meses)".

---

## Task 8: ExpensesDonut on MonthDetail

`src/routes/monthDetail/ExpensesDonut.svelte` — donut chart of `expensesDonut(store, key, displayCurrency)`. Hidden when there are no expenses. Slice colors come from `category.color`.

---

## Task 9: Command palette

`src/components/CommandPalette.svelte` — opens on `Cmd/Ctrl+K`. List of commands: Navigate to Overview / Months / Investments / Settings / Onboarding; New expense / income / FX / salary received; Toggle theme / language. Keyboard navigation (arrows + Enter). Renders at root in `App.svelte`.

---

## Task 10: A11y + reduced-motion sweep

- Audit focus-visible: every interactive element must show a visible focus ring (`:focus-visible` rule in `app.css`).
- Verify `aria-label` / `aria-pressed` / `role` on icon-only buttons (FAB menu, swatches, action buttons).
- `prefers-reduced-motion` already disables CSS transitions globally; ensure ECharts respects it (Task 1 covers this).
- Contrast check on dark + light palettes against AA. Adjust any text/secondary that fails.

---

## Self-Review Checklist

- Spec coverage at end of Phase 4: investments UI ✓, contribute + snapshot flows ✓, combined chart ✓, per-holding sparkline + return ✓, net-worth 12-month chart ✓, expenses donut ✓, command palette ✓, a11y polish ✓.
- Every file ≤ 200 lines.
- All chart series use theme tokens (no hardcoded colors outside `theme/`).
- All UI strings flow through i18n.
- ECharts is lazy-loaded; Overview/no-chart routes don't pay the bundle cost on first paint.
- Push to `origin/main` after every task.

---

## Out of Scope (possible Phase 5)

- Real-time market data integration for holdings.
- Cloud sync / multi-device.
- Recurring expenses / subscriptions.
- Budgets per category with alerts.
