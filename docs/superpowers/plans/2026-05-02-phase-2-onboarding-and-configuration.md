# Phase 2 — Onboarding + Configuration + Persistence

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Get the app to "I can configure everything" — first-run welcome screen, fully editable settings, layered persistence per domain. No transaction logging yet (Phase 3).

**Architecture:** All state still lives under the single versioned `fm:v1` localStorage key from Phase 1. New `db/*.ts` modules wrap reads/writes for each domain (categories, accounts, months, investments) with pure functions that take/return the `Store`. UI layer subscribes via a small `appStore` (writable wrapping `loadStore()`/`saveStore()`).

**Tech Stack additions:** `crypto.randomUUID` (built-in) for IDs, no new deps expected.

**Conventions (inherited from Phase 1):** English code, ≤200 lines per file, Given/When/Then comments in tests, `@/` alias for cross-folder imports, tests mirror `src/` structure, push to `origin/main` after every task, CHANGELOG entry per task.

---

## File Structure (Phase 2 outputs)

```
src/
  lib/
    appStore.ts           # central writable Store + persistence sync + helpers
    uuid.ts               # randomUUID() wrapper (test-friendly)
    db/
      categories.ts       # seed defaults + CRUD
      accounts.ts         # CRUD + balance derivation
      months.ts           # create/get/rollover, status transitions
      investments.ts      # holdings/contributions/snapshots CRUD (schema only)
  components/
    Card.svelte           # glass card primitive
    MoneyInput.svelte     # numeric input + currency selector
    CurrencyPicker.svelte # standalone currency dropdown
  routes/
    Onboarding.svelte     # wizard shell + step routing
    onboarding/
      Step1Language.svelte
      Step2Salary.svelte
      Step3Balances.svelte
      Step4Holdings.svelte
  i18n/
    pt-br.ts              # extend with onboarding.* + settings.* keys
    en.ts
tests/
  lib/
    db/
      categories.test.ts
      accounts.test.ts
      months.test.ts
      investments.test.ts
    appStore.test.ts
    uuid.test.ts
```

---

## Task 1: UUID helper

**Files:** `src/lib/uuid.ts`, `tests/lib/uuid.test.ts`

Behavior:
- `newId()` returns `crypto.randomUUID()`.
- Exported as a single function so tests of consumers can stub it.

TDD steps: write a test asserting the return type is a string of UUIDv4 shape, then implement, then commit + push.

---

## Task 2: db/categories.ts (TDD)

**Files:** `src/lib/db/categories.ts`, `tests/lib/db/categories.test.ts`

Behavior:
- `defaultExpenseCategories(language)` returns 8 seed entries (Mercado, Aluguel, Transporte, Lazer, Saúde, Contas, Restaurantes, Outros — pt-BR; same translated for `en`). Each has `{ id, name, color, archived: false }`. Colors come from a small palette (rotating).
- `defaultInvestmentCategories(language)` returns 5 seeds (Renda Fixa, Ações, FIIs, Cripto, Tesouro Direto). Same translation behavior.
- `addCategory(store, kind, input)` appends.
- `updateCategory(store, kind, id, patch)` patches by id.
- `archiveCategory(store, kind, id)` toggles `archived`.
- `removeCategory(store, kind, id)` deletes (only if no transactions reference it — but no transactions exist yet, so simple delete).

Tests cover seeds for both languages, add returns id, update patches, archive toggles, remove drops.

---

## Task 3: db/accounts.ts (TDD)

**Files:** `src/lib/db/accounts.ts`, `tests/lib/db/accounts.test.ts`

Behavior:
- `addAccount(store, input)` creates account.
- `removeAccount(store, id)`.
- `accountBalance(store, id, monthKey)` derives current balance: `openingBalance + sum(incomes) + sum(salary if matches account) − sum(expenses) ± fxTransfers`. For Phase 2, since no transactions exist, returns `openingBalance`.

Tests: add returns id, remove drops, balance equals openingBalance when no transactions.

---

## Task 4: db/months.ts (TDD)

**Files:** `src/lib/db/months.ts`, `tests/lib/db/months.test.ts`

Behavior:
- `monthKey(date)` → `'YYYY-MM'`.
- `createMonth(store, key, openingBalances)` returns store with new `Month` (status `'open'`, empty arrays).
- `getOrCreateCurrentMonth(store, today)` ensures the month for `today` exists and returns the updated store + key.
- `rolloverIfNeeded(store, today)`:
  - If newest month is older than `today.month`, mark previous as `'grace'` (with `closedAt = today + 7 days`), create new month with `openingBalances` inherited from previous `closingBalances` or fall back to previous `openingBalances`.
  - Sweep months whose grace deadline passed → `'closed'`.
  - Returns `{ store, createdMonths: [...], closedMonths: [...] }`.
- `closeMonth(store, key, balances)` sets `status: 'closed'`, persists `closingBalances`, stamps `closedAt`.

Tests: monthKey formatting; createMonth shape; rolloverIfNeeded covers (a) no rollover needed, (b) one-month gap, (c) two-month gap creates intermediate(s), (d) grace deadline elapsed → closed.

---

## Task 5: db/investments.ts (TDD)

**Files:** `src/lib/db/investments.ts`, `tests/lib/db/investments.test.ts`

Behavior (schema only — UI lands in Phase 3):
- `addHolding(store, input)`, `removeHolding(store, id)`.
- `addContribution(store, input)`, `addSnapshot(store, input)`.
- `holdingReturn(store, holdingId)` returns `{ contributed, marketValue, deltaAbsolute, deltaPercent }` from latest snapshot vs sum of contributions.

Tests cover each function plus return calc with 0/1/many contributions and snapshots.

---

## Task 6: appStore (TDD)

**Files:** `src/lib/appStore.ts`, `tests/lib/appStore.test.ts`

Behavior:
- `appStore` — Svelte writable wrapping `loadStore()`. On any update, persists via `saveStore`.
- `update(mutator)` helper: `appStore.update(s => mutator(s))` so callers can do `update(s => addCategory(s, 'expense', {...}))`.
- On import, syncs `locale` and `theme` stores to match `settings.language` / `settings.theme` (one-shot at init).
- Exposes `derived` selectors: `settings`, `currentMonth`, `categories`.

Tests: load → values; update mutates and persists; settings change reflects on locale/theme stores.

---

## Task 7: Card.svelte

**Files:** `src/components/Card.svelte`

Glass card primitive: `<Card title? variant="glass|raised">{children}</Card>`. Uses `--bg-glass`/`--bg-raised`, `--border-subtle`, `--shadow-glass`, `--radius-lg`. ~50 lines.

---

## Task 8: MoneyInput.svelte

**Files:** `src/components/MoneyInput.svelte`

Numeric input with adjacent currency dropdown:
- Props: `value` (number, bindable), `currency` (string, bindable), `currencies` (string[]), `placeholder`, `disabled`.
- `inputmode="decimal"`, formats display per locale on blur, parses on input.
- Visual: input + small select welded together with `--bg-raised` and `--border-subtle`.

---

## Task 9: CurrencyPicker.svelte

**Files:** `src/components/CurrencyPicker.svelte`

Standalone select with `value` (bindable) and `options` (string[]). Reused inside MoneyInput and onboarding.

---

## Task 10: Onboarding shell + Step 1 (Language / Currencies)

**Files:**
- `src/routes/Onboarding.svelte` (replaces placeholder) — keeps wizard state in a local `$state` object, renders the active step component, has Back/Next buttons.
- `src/routes/onboarding/Step1Language.svelte`
- Extend `src/i18n/{pt-br,en}.ts` with `onboarding.*` keys (welcome, step labels, button labels, etc.)

Step 1 fields: `language` (radio pt-BR / en, defaults to `detectLocale(navigator.language)`), `displayCurrency` (CurrencyPicker over a fixed list `['BRL','USD','CAD','EUR']`), `activeCurrencies` (multi-checkbox of the same list, displayCurrency auto-checked + locked).

App.svelte boot guard: if `!settings.onboarded` and not already on `/onboarding`, redirect via `push('/onboarding')`.

---

## Task 11: Onboarding Step 2 (Salary)

**Files:** `src/routes/onboarding/Step2Salary.svelte`

Fields:
- Has salary (yes/no toggle — for friends with no fixed salary)
- If yes: amount (MoneyInput; currency limited to `activeCurrencies`), `salaryDayOfMonth` (1-31 picker)
- If no: skip salary configuration; `salaryAmount = 0`

Validation: amount > 0 if "yes"; day 1-31.

---

## Task 12: Onboarding Step 3 (Opening Balances)

**Files:** `src/routes/onboarding/Step3Balances.svelte`

For each currency in `activeCurrencies`, render a labeled MoneyInput showing that currency's current saved balance (initial 0). Validation: numbers, can be 0 or negative (rare but allowed).

---

## Task 13: Onboarding Step 4 (Holdings — optional)

**Files:** `src/routes/onboarding/Step4Holdings.svelte`

"Quer registrar investimentos existentes? (Opcional)" + button to skip.
If user adds: list of `{ name, type (CategoryPicker over investment categories), currency (CurrencyPicker), currentValue }`. Up to 10 entries; can remove any.

On Next from step 3 if no holdings configured, jump straight to finish; otherwise step 4.

---

## Task 14: Onboarding completion

**Files:** Update `src/routes/Onboarding.svelte` Finish handler.

On Finish:
1. Persist all collected wizard data via `appStore.update(...)`.
2. Seed default categories using chosen language.
3. Create accounts (one per currency, named `<Currency> wallet` initially).
4. Create the current month with the entered opening balances.
5. Create holdings from step 4 (with initial Snapshot at today's value as the only snapshot so growth chart starts from there).
6. Set `settings.onboarded = true`.
7. `push('/')`.

---

## Task 15: Settings UI — categories CRUD

**Files:** Update `src/routes/Settings.svelte` (or split into `routes/settings/Categories.svelte` and import).

Two tabs: Expense / Investment categories. Each is a list of cards with name (editable inline), color picker (8-color palette), archive toggle, delete button. "Add new" form at the top.

Wires through `db/categories` functions via `appStore.update`.

---

## Task 16: Settings UI — currencies / salary / display currency

**Files:** Update Settings or split into `routes/settings/General.svelte`.

Editable: `displayCurrency`, `activeCurrencies` (multi-select), `salaryAmount`, `salaryCurrency`, `salaryDayOfMonth`. Removing a currency requires it not be in use by any account/transaction (no transactions yet, so just guard accounts).

---

## Task 17: Settings UI — export / import JSON

**Files:** `src/routes/settings/Backup.svelte` (or section in Settings.svelte).

- **Export:** button calls `JSON.stringify(get(appStore))`, creates a Blob, downloads as `fm-backup-YYYY-MM-DD.json` via an `<a download>` click.
- **Import:** `<input type="file" accept="application/json">` reads file, parses, validates `schemaVersion === 1` and required keys exist; if OK, shows confirmation modal ("This will overwrite all your current data. Continue?"), then `saveStore` + reload. If validation fails, show error banner.

---

## Task 18: App boot — rates fetch + month rollover

**Files:** Update `src/App.svelte`.

On mount:
1. `ensureRates(settings.activeCurrencies)` — non-blocking; on `stale` show a small banner.
2. `rolloverIfNeeded(store, new Date())` — apply rollover, persist.
3. If `!settings.onboarded`, navigate to `/onboarding` (unless already there).
4. Subscribe `settings.theme` and `settings.language` changes back to `theme`/`locale` stores (covered by appStore Task 6 already).

CHANGELOG entry: app now self-bootstraps state on every load.

---

## Self-Review Checklist

After completing all tasks:
- Spec coverage: onboarding ✓, categories CRUD ✓, currency management ✓, salary editor ✓, export/import ✓, month rollover on boot ✓, rates ensure on boot ✓. **Out of scope (Phase 3):** transaction logging UI, Overview real data, Months list UI, MonthDetail edit UI.
- Every file ≤ 200 lines.
- All test files use Given/When/Then comments.
- Every commit pushed to `origin/main`.

---

## Phase 3 Preview (after Phase 2 ships)

- Expense / income / FX transfer / "salary received" modals.
- Real Overview dashboard with current-month numbers and 12-month chart.
- Months list timeline + MonthDetail edit (with closed-month unlock).
- Investments page: combined contributions/market-value chart + per-holding cards.
- Command palette (`cmd/ctrl+k`), keyboard shortcuts, swipe-to-delete.
- Accessibility sweep + `prefers-reduced-motion` honor + animations polish.
