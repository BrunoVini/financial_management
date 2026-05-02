# Phase 3 — Transactions + Real Overview / Months Views

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Get the app to "I can record my finances and see them" — full transaction logging (expenses, extra incomes, FX transfers, salary received), Overview dashboard with real numbers, Months timeline, MonthDetail with edit + closed-month unlock. Charts and Investments UI stay in Phase 4.

**Architecture:** Domain-pure helpers in `src/lib/db/transactions.ts`. Real `accountBalance` finally folds transactions in. UI uses a single `Modal` primitive for all entry forms. All persistence through `appStore.mutate(...)`.

**Conventions inherited from Phase 1/2:** English code, ≤200 lines per file (split when needed), Given/When/Then comments in tests, `@/` alias, tests mirror `src/` layout, push to `origin/main` after every task, CHANGELOG entry per task.

---

## File Structure (Phase 3 outputs)

```
src/
  lib/
    db/
      transactions.ts          # addExpense, addIncome, addFxTransfer, removals, summaries
  components/
    Modal.svelte               # accessible dialog primitive (focus trap, escape, backdrop)
    ActivityList.svelte        # compact list of latest transactions
    BalancePill.svelte         # pill showing native + converted amount
  routes/
    Overview.svelte            # full dashboard
    Months.svelte              # timeline of past + current month
    MonthDetail.svelte         # editable detail
    overview/
      NetWorthCard.svelte
      MonthSummaryCard.svelte
      SalaryCard.svelte
      InvestedCard.svelte
    transactions/
      ExpenseModal.svelte
      IncomeModal.svelte
      FxTransferModal.svelte
      SalaryReceivedModal.svelte
tests/
  lib/
    db/
      transactions.test.ts
    accounts.test.ts           # extended with transaction balance cases
```

---

## Task 1: db/transactions.ts (TDD)

**Files:** `src/lib/db/transactions.ts`, `tests/lib/db/transactions.test.ts`

Behavior:
- `addExpense(store, input)` appends to `months[currentMonthKey].expenses`. Input: `{ amount, currency, categoryId, accountId, note?, date }`. Returns `{ store, id }`.
- `addIncome(store, input)` appends to `extraIncomes`.
- `addFxTransfer(store, input)` appends a single `FxTransfer` to the month. Input: `{ fromCurrency, toCurrency, fromAmount, toAmount, rate, date }`.
- `setSalaryReceived(store, monthKey, input)` writes `month.salary = { amount, currency, rateToDisplay, receivedAt }`.
- `removeExpense(store, monthKey, id)`, `removeIncome(store, monthKey, id)`, `removeFxTransfer(store, monthKey, id)`.
- `monthExpenseTotalsByCategory(store, monthKey, displayCurrency, rates)` returns `Record<categoryId, number>` with each total in `displayCurrency`.
- `monthExpenseTotal(store, monthKey, displayCurrency, rates)` total expenses converted.
- `monthIncomeTotal(store, monthKey, displayCurrency, rates)` salary + extras converted (salary uses its locked `rateToDisplay`; extras use live rates).

Tests cover each function plus totals with mixed currencies.

---

## Task 2: Extend `accountBalance` to fold transactions

**Files:** Update `src/lib/db/accounts.ts` and `tests/lib/db/accounts.test.ts`.

Behavior of `accountBalance(store, accountId, monthKey)`:
- Start from `account.openingBalance`.
- Add `extraIncomes` matching account currency (sum amounts) up to `monthKey` inclusive (months ≤ monthKey).
- Subtract `expenses` matching `accountId` up to `monthKey`.
- Apply `salary` if the salary's currency matches the account's currency and the salary was received in that month — credits each month independently (i.e., months ≤ monthKey).
- Apply `fxTransfers`: if `fromCurrency` matches account currency, subtract `fromAmount`; if `toCurrency` matches, add `toAmount`.

Add tests for each contribution path.

> Implementation hint: keep this function pure and self-contained. A helper `accountActivityForMonth(store, account, monthKey)` returning `{ in, out }` is a fine extraction if the function trips the line limit.

---

## Task 3: Modal primitive (`src/components/Modal.svelte`)

Behavior:
- Props: `open` (bindable), `title`, `onclose`, `children`, `footer?` snippet.
- Renders a backdrop + centered card via Svelte 5 portal pattern (`{#if open}<div use:portal>...</div>{/if}`).
- ESC closes. Click on backdrop closes. Focus trapped to the dialog. `aria-modal="true"`, `role="dialog"`, labeled by title.
- Animated fade-in (skips when `prefers-reduced-motion`).

Lightweight DOM tests are optional; smoke build is enough.

---

## Task 4: Expense modal

**Files:** `src/routes/transactions/ExpenseModal.svelte`

Form fields:
- Amount + currency (`MoneyInput`, currencies = `settings.activeCurrencies`).
- Category (select over `categories.expense.filter(!archived)`).
- Account (select over `accounts.filter(currency === selectedCurrency)`).
- Date (`<input type="date">`, default today).
- Note (`<textarea>`, optional).

On submit: `mutate(s => addExpense(s, currentMonthKey(s), input))`. Validates amount > 0, category required, account required.

---

## Task 5: Income modal

`src/routes/transactions/IncomeModal.svelte` — same shape as expense modal but with category from `expense` categories of kind "extra income" (or simply omit category — Income.categoryId is optional). Decision for this plan: keep optional category, not used yet but persisted.

---

## Task 6: FX Transfer modal

`src/routes/transactions/FxTransferModal.svelte`. Fields: source currency (CurrencyPicker), source amount (MoneyInput), target currency, target amount, rate (auto-derived if both amounts provided), date. Validation: from/to currencies differ, both amounts > 0.

---

## Task 7: Salary received flow

`src/routes/transactions/SalaryReceivedModal.svelte` opened from a Salary card on Overview. Pre-fills with `settings.salaryAmount` + `settings.salaryCurrency`. Suggests today's live rate to `displayCurrency`; user can adjust. On submit, `setSalaryReceived(store, currentMonthKey, { amount, currency, rateToDisplay, receivedAt })`.

---

## Task 8: BalancePill + ActivityList components

- `BalancePill.svelte`: shows currency code + amount (in native currency) + a tiny converted amount underneath. Uses `formatMoney`.
- `ActivityList.svelte`: receives an array of normalized entries `{ id, kind: 'expense'|'income'|'fx'|'salary', amount, currency, date, label, categoryColor? }` sorted desc by date. Each row: colored dot (category color or kind color), label, amount, date. Empty state when array is empty.

---

## Task 9: Overview real data

`src/routes/Overview.svelte` (replaces placeholder). Sections:
- Header: month name + display currency + ratesStale banner (already in App.svelte; ensure it still renders here).
- `NetWorthCard`: total patrimônio in display currency (sum of account balances at current month + sum of latest holding snapshots, all converted via live rates) + per-currency `BalancePill` row.
- `MonthSummaryCard`: gastos do mês total + income total + saldo livre, with delta vs previous month.
- `SalaryCard`: if `settings.salaryAmount > 0`, show expected amount + day. If month already has `salary`, show "received on X with rate Y". If not, button "Mark received" opens `SalaryReceivedModal`.
- `InvestedCard`: total invested (sum of latest snapshots, converted). Hint "Detalhes em Investimentos".
- Activity feed: latest 10 transactions in current month via `ActivityList`.
- FAB (bottom-right): quick "+" that opens `ExpenseModal` (mobile-first; desktop also).

---

## Task 10: Months list

`src/routes/Months.svelte` — vertical timeline. Each card:
- Period (e.g., "Maio 2026")
- Status badge (open / grace / closed)
- Salary (if received) + total spent + delta of net worth
- Click → `/months/:key`

Empty state: "Você só tem o mês atual. Nada pra mostrar ainda."

---

## Task 11: MonthDetail (editable)

`src/routes/MonthDetail.svelte`:
- Header: month label + status badge + close-month controls.
- "Closed month" banner when status === 'closed' with "Edit anyway" button that flips an `unlocked` local state allowing edits.
- Salary row (read or edit via `SalaryReceivedModal`).
- Expenses table/list (filterable by category) with delete + add.
- Extra incomes list with delete + add.
- FX transfers list with delete + add.
- Opening / closing balances summary.
- "Close month" button (flips status to closed and prompts for closingBalances pre-filled with derived values).

---

## Task 12: Wire FAB + global modal state

A small writable `transactionModal` store in `src/lib/uiStore.ts` holding `{ kind: 'expense'|'income'|'fx'|'salary'|null }`. `App.svelte` renders the appropriate modal at the root. FAB on Overview and the keyboard shortcut `n` set this store. ESC closes via the modal's existing close handler.

---

## Self-Review Checklist

- Spec coverage: expense ✓, extra income ✓, fx transfer ✓, salary received ✓, real Overview ✓, Months timeline ✓, MonthDetail with closed-month edit ✓.
- Phase 4 still owns: investments page UI, ECharts wrapper, all charts, command palette, swipe-to-delete, accessibility sweep, animations polish.
- Every file ≤ 200 lines.
- All tests use Given/When/Then.
- Push to `origin/main` after each task.

---

## Phase 4 Preview

- Apache ECharts wrapper (lazy-loaded per route).
- Investments page: cumulative contributions vs market-value combined chart, per-holding cards with sparkline, contribute / snapshot flows.
- 12-month net-worth area chart on Overview.
- Per-month donut of expenses by category in MonthDetail.
- Command palette (`cmd/ctrl+k`).
- Swipe-to-delete on mobile lists.
- Animations polish + full a11y sweep + AA contrast audit.
