# Financial Management — Design Spec

**Date:** 2026-05-02
**Status:** Draft, pending user review
**Author:** Bruno + Claude (brainstorming)

## Goal

A static, single-page web app for personal financial management that:

- Runs entirely client-side (deployable to GitHub Pages).
- Persists data in `localStorage` with a versioned schema.
- Tracks multi-currency balances (CAD, USD, BRL by default; configurable).
- Records monthly salary, extra incomes, and expenses; supports investments with contributions and monthly market-value snapshots.
- Provides an overview dashboard, per-month detail with edit capability, an investments page with growth charts, and configurable settings.
- Mobile-first responsive UI in a "dark premium / glass" visual direction with i18n (PT-BR + EN).
- Backup via JSON export/import.

## Non-Goals

- No backend, no cloud sync, no authentication.
- No real-time market data for investment holdings — market values are user-entered snapshots.
- No tax calculation or accounting-grade reporting.
- No transaction-level integration with banks/brokers.

## Stack

- **Build:** Vite + Svelte + TypeScript.
- **Routing:** `svelte-spa-router` (hash-based; works on GitHub Pages without server config).
- **Charts:** Apache ECharts, lazy-loaded per route.
- **Icons:** `lucide-svelte`.
- **Linting:** ESLint (`eslint`, `@typescript-eslint`, `eslint-plugin-svelte`) + Prettier. CI step fails on lint errors.
- **Currency rates:** [frankfurter.app](https://frankfurter.app) (free, no key, CORS-friendly).
- **Deploy:** GitHub Action builds `dist/` and publishes to `gh-pages` branch.

## Code Conventions

- All identifiers, filenames, comments, and commit messages in **English**.
- **Hard limit: 200 lines per file.** Files approaching the limit must be split by responsibility (extract sub-components, helpers, or domain modules). Enforced via an ESLint rule (`max-lines`).
- No hardcoded colors outside `src/theme/`. No inline UI strings outside `src/i18n/`.

## File Layout

```
src/
  lib/
    storage.ts          # typed localStorage wrapper, schema version + migrations
    rates.ts            # frankfurter client + daily cache
    money.ts            # formatting, conversion, multi-currency math
    db/
      months.ts
      accounts.ts
      categories.ts
      investments.ts
    types.ts            # central TS interfaces
  theme/
    index.ts            # active theme store, re-exports
    tokens.ts           # non-color tokens (spacing, radius, shadows, typography)
    dark.ts             # dark palette (default)
    light.ts            # light palette
  i18n/
    index.ts            # locale store + t() helper
    pt-br.ts
    en.ts
  components/
    Card.svelte
    MoneyInput.svelte
    CategoryPicker.svelte
    Chart.svelte
    BottomNav.svelte
    Sidebar.svelte
  routes/
    Overview.svelte
    Months.svelte
    MonthDetail.svelte
    Investments.svelte
    Settings.svelte
    Onboarding.svelte
  App.svelte
  main.ts
```

## Data Model

Single root key `fm:v1` in `localStorage`. Schema version makes future migrations safe.

```ts
type Currency = 'BRL' | 'USD' | 'CAD' | string;
type MonthKey = string; // 'YYYY-MM'

interface Store {
  schemaVersion: 1;

  settings: {
    language: 'pt-BR' | 'en';
    theme: 'dark' | 'light';
    displayCurrency: Currency;
    salaryCurrency: Currency;
    salaryAmount: number;
    salaryDayOfMonth: number;        // 1-31
    activeCurrencies: Currency[];
    onboarded: boolean;
  };

  categories: {
    expense: Category[];
    investment: Category[];
  };

  accounts: Account[];               // { id, name, currency, openingBalance }

  months: Record<MonthKey, Month>;

  investments: {
    holdings: Holding[];             // { id, name, type, currency, createdAt }
    contributions: Contribution[];   // { id, holdingId, monthKey, amount, currency, date }
    snapshots: Snapshot[];           // { id, holdingId, monthKey, marketValue, currency, takenAt }
  };

  ratesCache: {
    fetchedAt: string;               // ISO date
    base: 'EUR';
    rates: Record<Currency, number>;
  };
}

interface Category {
  id: string;
  name: string;                      // free text; not localized — user-editable
  color: string;                     // hex
  icon?: string;                     // lucide icon name
  archived: boolean;
}

interface Month {
  key: MonthKey;
  status: 'open' | 'grace' | 'closed';
  closedAt?: string;
  editedAt?: string;
  salary: {
    amount: number;
    currency: Currency;
    rateToDisplay: number;           // rate at moment of receipt — locked
    receivedAt: string;
  } | null;
  extraIncomes: Income[];            // { id, amount, currency, categoryId?, note, date }
  expenses: Expense[];               // { id, amount, currency, categoryId, accountId, note, date }
  fxTransfers: FxTransfer[];         // paired exits/entries when user converts manually
  openingBalances: Record<Currency, number>;
  closingBalances?: Record<Currency, number>;
}
```

**Key invariants:**

- Every transaction stores its **native** amount + currency. Conversion happens only at display time.
- `salary.rateToDisplay` is locked at the moment of receipt; long-held foreign balances are always live-converted.
- Account/currency balances are **derived** at runtime from `openingBalances + transactions`, not persisted, to avoid drift.
- Investment growth chart uses `snapshots`; profitability per holding = `latestSnapshot.marketValue − sum(contributions)`.

## Screens

| Route                | Purpose                                                                          |
|----------------------|----------------------------------------------------------------------------------|
| `/onboarding`        | First-run wizard: currencies, salary, opening balances, existing holdings.       |
| `/`                  | Overview of current month: net worth, currency pills, expenses, free balance, 12-month area chart, latest entries, FAB. |
| `/meses`             | Vertical timeline of past months (cards: salary, total spent, net delta, status). |
| `/meses/:key`        | Month detail: editable salary, extra incomes, filterable expense list, balances. Closed months require explicit unlock. |
| `/investimentos`     | Combined chart (cumulative contributions vs market value), per-holding cards with sparkline + return %, contribute / snapshot actions. |
| `/configuracoes`     | Language, theme, currencies, salary base, categories (drag-reorder, color), backup (export/import), force rate refresh. |

**Navigation:** sidebar fixed on desktop, bottom nav on mobile (5 icons). Global keyboard shortcuts: `n` new expense, `i` new contribution, `cmd/ctrl+k` palette.

## Key Flows

### Onboarding (first run)

1. Detect `settings.onboarded === false` → redirect to `/onboarding`.
2. Wizard: (a) currencies + display currency + language, (b) salary base/currency/day, (c) opening balances per currency + existing holdings.
3. Seed default categories (expense + investment) with names drawn from the selected language at this moment. Stored as free text — renaming the language later does not retranslate them.
4. Create current month, set `openingBalances`, mark `onboarded = true`.

### App Open (recurring)

1. If `ratesCache.fetchedAt !== today`, fetch frankfurter `latest?from=EUR&to=<all active>`. On failure use cached rates with a "stale rates" badge.
2. If today's `YYYY-MM` is later than newest month:
   - Mark previous month `status='grace'` with a 7-day window.
   - Create new month `status='open'` with `openingBalances` inherited from previous `closingBalances`.
   - Recreate `salary` slot (unlocked) from `settings.salaryAmount/Currency`.
3. Sweep months whose grace window has elapsed → `status='closed'`.

### Logging an Expense

Modal triggered by FAB or `n`: amount + currency (defaults to selected account's currency) + category + note + date + source account → persists into `months[currentKey].expenses`.

### Salary Receipt / FX Transfer

- Salary card has two states: "expected" and "received". Clicking "I received" opens a modal that suggests today's live rate, lets the user adjust, and locks `rateToDisplay` + `receivedAt`.
- Manual currency conversions (e.g., real USD → BRL move) are recorded as `FxTransfer`: paired outgoing + incoming entries with the actual rate the user used.

### Investments

- **Contribution:** form adds a `Contribution` to the holding, increasing total invested.
- **Monthly snapshot:** end-of-month nudge prompts the user to update each holding's `marketValue`. Snapshots feed the growth chart.
- Per-holding return = `marketValue − sumOfContributions` (absolute and %).

### Editing Closed Months

Banner: "Closed month. [Edit anyway]". Confirmation required. Successful edit stamps `editedAt` for light auditing.

### Backup

- **Export:** Settings → "Export data" downloads `fm-backup-YYYY-MM-DD.json` (the entire `Store`).
- **Import:** Settings → "Import data" opens file picker → validates `schemaVersion` + shape → confirms overwrite → migrates if older version → reloads.

## Theming

- All color values live in `src/theme/{dark,light}.ts`. Components import `theme/index.ts`, which exposes a Svelte store reflecting `settings.theme`. **No hardcoded colors anywhere else.**
- `tokens.ts` holds non-color tokens (spacing scale `4/8/12/16/24/32/48`, radii `4/8/12/16/24`, fluid type scale via `clamp()`, transition timings).
- Dark palette (sketch): deep indigo background, glass cards (`rgba(255,255,255,0.06)` with backdrop blur), purple→pink gradient accent, semantic green/red/amber/blue, currency-specific pill colors (BRL green, USD blue, CAD red).

## i18n

- `src/i18n/{pt-br,en}.ts` export string maps. `index.ts` exposes a Svelte store + `t(key)` helper.
- Initial language: `settings.language` if set, else `navigator.language` heuristic, else `pt-BR`.
- All UI strings flow through `t()` — no inline literals in components.

## Charts (ECharts)

- Single `<Chart>` wrapper applies the dark theme tokens automatically; consumers pass an `option` object.
- Overview: 12-month net-worth area chart with gradient.
- Investments page: combined cumulative contributions (line) + market value (area), rich tooltip showing return.
- Per-holding: minimal sparkline.
- Per-month: donut of expenses by category (colors from `categories.expense[].color`).
- Lazy-loaded via `import('echarts')` per route to keep Overview's initial bundle small.

## Responsive Strategy (mobile-first)

- Breakpoints: `sm 480` / `md 768` / `lg 1024` / `xl 1280`.
- Mobile: bottom nav, FAB, single-column stacked cards, full-screen modals, `inputmode="decimal"` on money inputs, ≥44px touch targets, swipe-left to delete in lists.
- Tablet: 2-column grid in Overview, collapsible sidebar.
- Desktop: persistent sidebar, 3-4 column grid, keyboard shortcuts.
- Built with native CSS Grid/Flex + container queries; no layout libraries.
- Honors `prefers-reduced-motion`.

## Accessibility

- AA contrast minimum.
- Visible focus rings (not removed).
- ARIA labels on icon-only buttons.
- Semantic HTML (`<nav>`, `<main>`, `<dialog>` for modals).

## Currency Rates Strategy

- One frankfurter call per day per device. Single request returns all active currencies.
- Cached in `ratesCache` with `fetchedAt` (ISO date string).
- Manual "refresh rates" button in Settings.
- Network failure → fall back to cache + visible "stale rates" badge.

## Open Questions

None at spec time — all major decisions resolved during brainstorming.

## Out-of-Scope (Possible Future Work)

- Cloud sync / multi-device.
- Real-time market data integration.
- Recurring expenses / subscriptions tracker.
- Budgets per category with alerts.
- Charts beyond ECharts defaults (e.g., custom SVG visualizations).
