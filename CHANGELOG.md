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

### Changed

- Replaced default Vite Svelte template `App.svelte` with a placeholder for the upcoming router shell.
- Replaced the Vite Svelte template's heavy demo `app.css` with a lean theme-driven stylesheet (CSS bundle dropped from ~4.1 kB to ~1.15 kB).
- Swapped Vitest test environment from `jsdom` to `happy-dom` to avoid an `ERR_REQUIRE_ESM` failure in `@asamuzakjp/css-color` under Node 20.x.

### Removed

- Deprecated `hot` option from `vite-plugin-svelte` config (no longer accepted in v7).

[Unreleased]: https://github.com/BrunoVini/financial_management/commits/main
