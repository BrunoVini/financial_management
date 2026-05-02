# Phase 5 — Recurring expenses, Budgets, Filters, CSV export

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Round out the app with three features that show up in every personal-finance tool and one quality-of-life export. Bump to **v1.0.0** at the end.

**Conventions inherited from Phases 1-4:** English code, ≤200 lines per file, Given/When/Then comments in tests, `@/` alias, tests mirror `src/` layout, push to `origin/main` after every task, CHANGELOG entry per task.

---

## File Structure (Phase 5 outputs)

```
src/
  lib/
    db/
      recurring.ts                    # subscription CRUD + apply-on-rollover (TDD)
      budgets.ts                      # set/get/listSpentVsBudget (TDD)
    csv.ts                            # toCsv(headers, rows) + downloadCsv (TDD)
  routes/
    settings/
      Subscriptions.svelte            # list + add subscription
      Budgets.svelte                  # set monthly target per expense category
    monthDetail/
      ActivitySearch.svelte           # search + category filter on activity list
      BudgetProgress.svelte           # progress bars per category for the month
    overview/
      BudgetSummaryCard.svelte        # top 3 most-committed budgets
  components/
    StatusFilter.svelte               # tabs / pills used by Months list
tests/
  lib/
    db/
      recurring.test.ts
      budgets.test.ts
    csv.test.ts
```

---

## Task 1: Subscriptions / recurring expenses (TDD)

**Files:** `src/lib/db/recurring.ts`, `tests/lib/db/recurring.test.ts`

Schema: extend `Store` with `subscriptions: Subscription[]`. Soft-migration in `loadStore` backfills `[]`.

```ts
interface Subscription {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  categoryId: string;
  accountId: string;
  dayOfMonth: number;        // 1-31, clamped to month length when applying
  active: boolean;           // pause/resume without deleting
  createdAt: string;
  appliedMonths: MonthKey[]; // bookkeeping so we don't double-apply
}
```

Functions:
- `addSubscription(store, input)` → `{ store, id }`
- `removeSubscription(store, id)` → `Store`
- `pauseSubscription(store, id, paused)` → toggles `active`
- `applyDueSubscriptions(store, monthKey, today)` → for every active subscription whose `appliedMonths` does NOT include `monthKey` and whose `dayOfMonth ≤ today.getDate()` (when `monthKey` is the current month) OR whose `monthKey ≤ today's month` (for past months that opened while the user was away), creates an `Expense` in that month using the standard `addExpense` helper, records the index in `appliedMonths`. Returns the updated `Store`.

Tests: add/remove, pause toggles active, apply on a fresh month creates the expense exactly once, idempotent on re-run, skips paused, handles month-end clamp (dayOfMonth=31 in February).

---

## Task 2: Boot integration

**Files:** Update `src/App.svelte`.

After `rolloverIfNeeded` in the boot effect, run `applyDueSubscriptions(store, currentMonthKey, new Date())`. This means subscriptions auto-credit when the app opens at the start of a new month (or any time the user reopens after the day-of-month has passed).

---

## Task 3: Subscriptions Settings UI

**Files:** `src/routes/settings/Subscriptions.svelte` (+ new section in `Settings.svelte`)

UI: Card listing existing subscriptions with description, amount, day, active toggle, delete. "+ Add" form below with the same fields used in ExpenseModal (amount + currency + category + account + day + description). i18n keys `settings.subs.*`.

---

## Task 4: Budgets DB module (TDD)

**Files:** `src/lib/db/budgets.ts`, `tests/lib/db/budgets.test.ts`

Schema: extend `Store` with `budgets: Record<string, number>` (categoryId → monthly limit in display currency). Soft-migrated to `{}`.

Functions:
- `setBudget(store, categoryId, amount)` → `Store` (zero / negative removes the entry)
- `getBudget(store, categoryId)` → `number | undefined`
- `categorySpendVsBudget(store, monthKey, displayCurrency, rates)` → `Array<{ categoryId; spent; limit; remaining; pctUsed }>` for every category that has either a budget or a non-zero spend.

Tests cover set/remove (zero), getter, vs-budget aggregation with mixed currencies.

---

## Task 5: Budgets Settings UI

**Files:** `src/routes/settings/Budgets.svelte` + section in `Settings.svelte`

For every expense category, a row with the category name and a `MoneyInput` set to the display currency. Empty / zero removes the budget. Saved through `setBudget(...)` via `mutate(...)` on blur.

---

## Task 6: Budget visualization

**Files:**
- `src/routes/monthDetail/BudgetProgress.svelte` — progress bars per category in the current month (uses `categorySpendVsBudget`). Bar color: green ≤80%, amber 80–100%, red >100%.
- `src/routes/overview/BudgetSummaryCard.svelte` — Overview card listing the top 3 most-committed budgets (sorted by `pctUsed` desc) with mini bars; hidden when no budget configured.

i18n keys `budget.*`.

---

## Task 7: Activity search on MonthDetail

**Files:** `src/routes/monthDetail/ActivitySearch.svelte`

Text input + a category select. Filters the entries passed to `ActivityList`. Empty input shows all. Search matches across `label` (case-insensitive). Category filter restricts to expenses with the chosen `categoryId` (other kinds are kept; they don't have a categoryId so the filter doesn't affect them when "All" is chosen).

Wire into `MonthDetail.svelte` between `PendingInstallments` and `ExpensesDonut`.

---

## Task 8: Status filter on Months

**Files:** `src/components/StatusFilter.svelte` + small change in `Months.svelte`

Pill row at the top: "Todos / Aberto / Graça / Fechado". Filters the timeline by `status`. "Todos" is the default.

---

## Task 9: CSV export

**Files:** `src/lib/csv.ts` + `tests/lib/csv.test.ts` + button in `Backup.svelte`

`toCsv(headers: string[], rows: (string | number)[][])` returns RFC-4180 string (escapes quotes, wraps any cell containing `,`/`"`/newline). `downloadCsv(filename, csv)` triggers a download.

Backup: add a "Export expenses (CSV)" button that downloads the current month's expenses as `expenses-YYYY-MM.csv` with columns: `date, currency, amount, category, account, note`.

Tests cover escaping, header row, empty input.

---

## Task 10: Bump to v1.0.0

**Files:** `package.json`, `CHANGELOG.md`

- `package.json` `version: "1.0.0"`.
- Promote the `[Unreleased]` section to a `[1.0.0] - YYYY-MM-DD` heading and add a fresh `[Unreleased]` placeholder above. Add the comparison link at the bottom.
- Commit message: `chore: release v1.0.0`.

---

## Self-Review Checklist

- Spec coverage: subscriptions ✓, budgets ✓, activity search ✓, status filter ✓, CSV export ✓.
- Each new module has G/W/T tests.
- Soft-migration in `loadStore` keeps existing data intact.
- Every file ≤ 200 lines.
- Push after every task; CHANGELOG entry per task.
- v1.0.0 tagged in `package.json` and CHANGELOG.

---

## Out of Scope (possible Phase 6+)

- Cloud sync.
- Real-time market data for holdings.
- Multiple budgets per category over time (different targets per quarter, etc.).
- Push reminders for due subscriptions.
