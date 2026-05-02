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
- Currency rates client (`src/lib/rates.ts`): `ensureRates(symbols)` calls `frankfurter.app` once per day and caches the response in `localStorage`; subsequent calls within the same day skip the network. On fetch error a stale cache is returned with `stale: true`; `clearRatesCache()` lets the user force a refresh.
- Theme system (`src/theme/`):
  - `tokens.ts` — non-color design tokens (spacing, radius, fluid type scale, motion, z-index).
  - `dark.ts` / `light.ts` — palettes (background, border, text, accent gradient, semantic colors, currency-specific pills, shadows). Dark palette is the default.
  - `index.ts` — `theme` Svelte store, `setTheme(name)`, `applyThemeToDocument(palette)` (writes CSS custom properties to `<html>` and sets `data-theme`), plus the `Palette` interface.
- Global stylesheet (`src/app.css`): CSS custom properties matching the dark palette (the active theme later overwrites them via `applyThemeToDocument`), reset of box-sizing, base body styles, and a `prefers-reduced-motion` media query that disables transitions/animations.

### Changed

- Replaced default Vite Svelte template `App.svelte` with a placeholder for the upcoming router shell.
- Replaced the Vite Svelte template's heavy demo `app.css` with a lean theme-driven stylesheet (CSS bundle dropped from ~4.1 kB to ~1.15 kB).
- Swapped Vitest test environment from `jsdom` to `happy-dom` to avoid an `ERR_REQUIRE_ESM` failure in `@asamuzakjp/css-color` under Node 20.x.

### Removed

- Deprecated `hot` option from `vite-plugin-svelte` config (no longer accepted in v7).

[Unreleased]: https://github.com/BrunoVini/financial_management/commits/main
