# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project scaffold: Vite + Svelte + TypeScript template, configured for GitHub Pages with a conditional `base` path and Vitest test runner.
- Runtime dependencies: `svelte-spa-router` (hash routing for GH Pages), `lucide-svelte` (icons).
- Dev tooling: Vitest + Testing Library + happy-dom, ESLint v9 (flat config) with `@typescript-eslint`, `eslint-plugin-svelte`, Prettier + `prettier-plugin-svelte`, `globals`.
- ESLint `max-lines` rule capping non-test source files at 200 lines (skipping blank lines and comments).
- `.editorconfig` enforcing UTF-8 / LF / 2-space indent / trim trailing whitespace (except `.md`).
- `.nvmrc` pinning Node 22 LTS.
- `.gitignore` entries for `.superpowers/` (brainstorm assets) and `.claude/` (local IDE state).
- Project `README.md` with status, dev / test / build / deploy instructions, and conventions.
- Pinned `@rolldown/binding-linux-x64-gnu` so fresh clones get the native binding.
- Vitest setup file (`tests/setup.ts`) loading `@testing-library/jest-dom/vitest` matchers and clearing `localStorage` before/after each test.
- Core domain types (`src/lib/types.ts`): `Store`, `Settings`, `Month`, `Salary`, `Income`, `Expense`, `FxTransfer`, `Account`, `Category`, `Holding`, `Contribution`, `Snapshot`, `RatesCache`, plus the `Currency` / `MonthKey` / `Language` / `ThemeName` / `MonthStatus` aliases.
- Versioned `localStorage` wrapper (`src/lib/storage.ts`): `defaultStore()`, `loadStore()`, `saveStore()`, plus the `ROOT_KEY` (`fm:v1`). Falls back to `defaultStore` on malformed JSON or unknown schema version.
- Test convention: all tests use **Given / When / Then** comments to label arrange / act / assert.
- Money utilities (`src/lib/money.ts`): `convert(amount, from, to, ratesEurBase)` cross-converts via the EUR base and returns `NaN` when a rate is missing; `formatMoney(amount, currency, language)` produces locale-aware currency strings via `Intl.NumberFormat`.
- Path alias `@` → `src/` (configured in `tsconfig.app.json` `paths` and `vite.config.ts` `resolve.alias`). Cross-folder imports use `@/lib/...` instead of relative `../src/...`. Existing tests migrated.
- Test layout now mirrors `src/`: `tests/lib/*.test.ts`, `tests/theme/index.test.ts`, `tests/i18n/index.test.ts`. Only `tests/setup.ts` (global Vitest setup) remains at the `tests/` root.
- Currency rates client (`src/lib/rates.ts`): `ensureRates(symbols)` calls `frankfurter.app` once per day and caches the response in `localStorage`; subsequent calls within the same day skip the network. On fetch error a stale cache is returned with `stale: true`; `clearRatesCache()` lets the user force a refresh.
- Theme system (`src/theme/`):
  - `tokens.ts` — non-color design tokens (spacing, radius, fluid type scale, motion, z-index).
  - `dark.ts` / `light.ts` — palettes (background, border, text, accent gradient, semantic colors, currency-specific pills, shadows). Dark palette is the default.
  - `index.ts` — `theme` Svelte store, `setTheme(name)`, `applyThemeToDocument(palette)` (writes CSS custom properties to `<html>` and sets `data-theme`), plus the `Palette` interface.
- Global stylesheet (`src/app.css`): CSS custom properties matching the dark palette (the active theme later overwrites them via `applyThemeToDocument`), reset of box-sizing, base body styles, and a `prefers-reduced-motion` media query that disables transitions/animations.
- i18n module (`src/i18n/`):
  - `pt-br.ts` / `en.ts` — translation dictionaries (initial keys: `nav.*`, `app.*`).
  - `index.ts` — `locale` writable store (default `pt-BR`), `setLocale(name)`, `t` derived store returning a `(key) => string` resolver that falls back to the key when a translation is missing, and `detectLocale(navLanguage)` heuristic (anything starting with `pt` → `pt-BR`, else `en`).
- Navigation components:
  - `src/components/Sidebar.svelte` — desktop side rail (220px, glass background, gradient pill on active item, hidden ≤768px).
  - `src/components/BottomNav.svelte` — mobile bottom bar (fixed, ≥44px touch targets, accent color on active item, only visible ≤768px).
  - Both share the same item list (Overview / Months / Investments / Settings), `lucide-svelte` icons, and `svelte-spa-router` `link`/`location` for active-state detection.
- Placeholder route pages (`src/routes/`): `Overview`, `Months`, `MonthDetail` (reads `:key` from `svelte-spa-router` `params`), `Investments`, `Settings`, `Onboarding`. Settings already wires the language and theme selects to the i18n and theme stores; the rest are minimal "coming in Phase 2/3" stubs ready to be filled in.
- App shell (`src/App.svelte`): mounts the four placeholder routes plus `MonthDetail` and `Onboarding` via `<Router {routes} />`, renders `<Sidebar />` and `<BottomNav />` around `<main>`, and applies the active palette to `<html>` reactively via `$effect(() => applyThemeToDocument($theme))`. Mobile lifts `<main>` 80px to clear the bottom nav; desktop drops the lift and the bottom nav hides.
- GitHub Pages deploy workflow (`.github/workflows/deploy.yml`): on every push to `main` (or manual `workflow_dispatch`), CI runs `npm ci`, `npm run lint`, `npm test`, and `npm run build` (with `GITHUB_PAGES=true` to prefix asset URLs with `/financial_management/`), then uploads `dist/` and deploys via `actions/deploy-pages@v4`. Node version is read from `.nvmrc`.

### Fixed

- `svelte-check` now points at `tsconfig.app.json` directly (instead of the references-based root `tsconfig.json`) — eliminates 4 pre-existing `composite`/`noEmit` warnings inherited from the Vite template.
- `tests/lib/rates.test.ts` now uses `globalThis.fetch` (typed) instead of `global.fetch` so the test type-checks cleanly under svelte-check.
- Silenced TypeScript 7 `baseUrl` deprecation warning via `ignoreDeprecations: "6.0"` in `tsconfig.app.json`.
- UUID helper (`src/lib/uuid.ts`): `newId()` thin wrapper around `crypto.randomUUID()` so tests of consumers can stub the call site without monkey-patching `crypto`.
- Categories DB module (`src/lib/db/categories.ts`): seeds (8 expense + 5 investment per language), `addCategory`, `updateCategory`, `archive/unarchiveCategory`, `removeCategory` — all pure `Store → Store` functions. Color palette rotates over 8 hex tones.
- Accounts DB module (`src/lib/db/accounts.ts`): `addAccount`, `removeAccount`, `getAccount`, `listAccountsByCurrency`, and `accountBalance(store, id, monthKey)` — Phase 2 returns the opening balance directly; Phase 3 will fold transactions into the calculation.
- Months DB module (`src/lib/db/months.ts`): `monthKey`, `nextMonthKey`, `createMonth`, `getOrCreateCurrentMonth`, `closeMonth`, and `rolloverIfNeeded(store, today)` — handles `open → grace → closed` transitions, inherits `closingBalances → openingBalances` across months, fills intermediate months when multiple periods passed, and sweeps elapsed grace deadlines into `closed`. `GRACE_DAYS = 7` matches the spec.
- Investments DB module (`src/lib/db/investments.ts`): `addHolding`, `removeHolding` (cascades to contributions + snapshots), `addContribution`, `addSnapshot`, and `holdingReturn(store, holdingId)` returning `{ contributed, marketValue, deltaAbsolute, deltaPercent }` based on summed contributions and the latest snapshot.
- Reactive `appStore` (`src/lib/appStore.ts`): a Svelte writable wrapping `loadStore()` that auto-persists every change via `saveStore()`. `mutate(fn)` helper for `Store → Store` updates. Derived selectors `settings`, `categories`, `accounts`, `months`, `investments`. Bidirectionally syncs `settings.language` ↔ `locale` store and `settings.theme` ↔ `theme` store, including the initial bootstrap so a refresh restores the saved language/theme.
- `Card.svelte` glass primitive: optional `title`, optional `actions` snippet, configurable `variant` (`glass` / `raised`) and `padding` (`sm` / `md` / `lg`). Uses Svelte 5 runes + Snippet props. Body renders via `children` snippet.
- `CurrencyPicker.svelte`: bindable `value` + `options[]` array, `aria-label`, `onchange` callback. Uses native `<select>` for accessibility.
- `MoneyInput.svelte`: numeric input glued to a `CurrencyPicker`. Bindable `value` (number) and `currency`. `inputmode="decimal"` opens numeric keyboard on mobile. Parses both `1.234,56` (pt-BR) and `1234.56` (en) formats.
- Onboarding wizard scaffold:
  - `src/routes/onboarding/state.ts` — shared writable `wizard` store with the full multi-step state, `defaultWizardState(language)` factory, `SUPPORTED_CURRENCIES = ['BRL','USD','CAD','EUR']`.
  - `src/routes/onboarding/Step1Language.svelte` — language radio (pt-BR / en), display currency picker, multi-select active currencies (display currency is auto-checked and locked, removing currencies syncs `openingBalances`).
  - `src/routes/Onboarding.svelte` — stepper UI with progress dots, Back/Next/Finish buttons, gradient title, fits 720px max width.
  - i18n keys `onboarding.*` added to both PT-BR and EN dictionaries.
- App boot guard in `App.svelte`: on mount, redirects to `/onboarding` when `settings.onboarded === false`. Sidebar and BottomNav hide on the onboarding route for a focused wizard experience.
- Onboarding Step 2 (`Step2Salary.svelte`): yes/no toggle for fixed salary, MoneyInput limited to active currencies, day-of-month picker (1-31, clamped).
- Onboarding Step 3 (`Step3Balances.svelte`): one row per active currency, decimal-keyboard input, parses both pt-BR and en numeric formats.
- Onboarding Step 4 (`Step4Holdings.svelte`): optional list of up to 10 holdings with name + type (from default investment categories) + value via MoneyInput; trash button per row, dashed +Add button.
- Onboarding completion (`src/routes/onboarding/finish.ts`): `applyWizard(store, wizardState, today)` pure function that persists settings, seeds default categories in the chosen language, creates one account per active currency, opens the current month with the entered balances, and seeds holdings + a starting snapshot per holding (skips blank-named entries). 5 G/W/T tests cover each effect.
- Settings page restructured into sections (`src/routes/settings/`):
  - `Appearance.svelte` — language and theme selectors (moved from Settings.svelte).
  - `Categories.svelte` + `CategoryRow.svelte` + `categoryPalette.ts` — Expense / Investment tabs, "+ Add category" form with name + 8-color palette swatches, list with inline rename, color recolor, archive toggle, delete. All wired through `db/categories` via `mutate(...)`.
  - i18n keys `settings.*` and `common.*` added to both dictionaries.
  - `General.svelte` — display currency picker, multi-select active currencies (display-currency and in-use currencies are locked), salary amount + currency via `MoneyInput`, pay-day numeric input.
- Backup module (`src/lib/backup.ts`): `validateImportedStore(raw)` strict shape check (rejects null/primitives, wrong `schemaVersion`, missing required keys); `backupFilename(date)` formats `fm-backup-YYYY-MM-DD.json`. 5 G/W/T tests.
- `Backup.svelte` settings section: Export downloads the full `Store` as a timestamped JSON file via `Blob` + `<a download>`. Import opens a hidden file picker, parses JSON, validates the schema, asks for confirmation before overwriting, then replaces the entire store. Inline error if the file is malformed.
- App boot logic in `App.svelte`: when an onboarded user opens the app, `rolloverIfNeeded(store, today)` runs first so any month that lapsed gets transitioned and the current month exists, then `ensureRates(activeCurrencies)` fetches frankfurter (cached daily) — a yellow "stale rates" banner appears at the top of `<main>` if the network call fails and the local cache is older than today.

### Fixed

- TypeScript narrowing for the wizard step counter in `Onboarding.svelte` (`Math.min`/`Math.max` returns `number`; the cast moved to wrap the whole expression).
- Bumped placeholder text on `Overview`, `Months`, `MonthDetail` from "Coming in Phase 2" to "Coming in Phase 3" now that Phase 2 is closed.

### Added (Phase 3)

- Transactions DB module (`src/lib/db/transactions.ts`): `addExpense / addIncome / addFxTransfer` (each return `{ store, id }`), `removeExpense / removeIncome / removeFxTransfer`, `setSalaryReceived` (accepts `null` to clear), `monthExpenseTotalsByCategory`, `monthExpenseTotal`, `monthIncomeTotal`. Income totals use the salary's locked `rateToDisplay` so historical numbers stay stable; extras use live rates. 9 G/W/T tests cover each function plus mixed-currency aggregation.

### Changed

- Replaced default Vite Svelte template `App.svelte` with a placeholder for the upcoming router shell.
- Replaced the Vite Svelte template's heavy demo `app.css` with a lean theme-driven stylesheet (CSS bundle dropped from ~4.1 kB to ~1.15 kB).
- Swapped Vitest test environment from `jsdom` to `happy-dom` to avoid an `ERR_REQUIRE_ESM` failure in `@asamuzakjp/css-color` under Node 20.x.
- `MoneyInput.svelte` and `CurrencyPicker.svelte` now accept optional `onValueChange` / `onCurrencyChange` / `onchange` callbacks alongside `bind:`. Pages that read from a derived store (where `bind:` is awkward) can hook updates through callbacks instead.

### Removed

- Deprecated `hot` option from `vite-plugin-svelte` config (no longer accepted in v7).

[Unreleased]: https://github.com/BrunoVini/financial_management/commits/main
