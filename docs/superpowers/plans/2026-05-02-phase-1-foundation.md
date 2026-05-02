# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a Vite + Svelte + TS project with theme system, i18n, versioned localStorage, currency rates client, app shell with routing, lint + 200-line rule, and a working GitHub Pages deploy. No domain features yet — the result is an empty themed shell that ships.

**Architecture:** Static SPA, hash routing for GH Pages, all state in `localStorage` under a single versioned root key. Tokens centralized in `src/theme/`, strings in `src/i18n/`. Library code (storage / money / rates) is fully unit-tested via Vitest. Components are smoke-tested.

**Tech Stack:** Vite, Svelte, TypeScript, svelte-spa-router, lucide-svelte, ESLint + @typescript-eslint + eslint-plugin-svelte, Prettier, Vitest, @testing-library/svelte, GitHub Actions.

**Conventions:**
- All code identifiers, filenames, comments, commit messages in **English**.
- **Hard limit: 200 lines per file.** Enforced by ESLint `max-lines`.
- No hardcoded colors outside `src/theme/`. No inline UI strings outside `src/i18n/`.
- Commits frequently — at the end of every task.

---

## File Structure (Phase 1 outputs)

```
.github/workflows/deploy.yml
.gitignore
.eslintrc.cjs
.prettierrc
package.json
tsconfig.json
vite.config.ts
index.html
src/
  main.ts
  App.svelte
  app.css
  lib/
    types.ts
    storage.ts
    money.ts
    rates.ts
  theme/
    tokens.ts
    dark.ts
    light.ts
    index.ts
  i18n/
    pt-br.ts
    en.ts
    index.ts
  components/
    Sidebar.svelte
    BottomNav.svelte
  routes/
    Overview.svelte
    Months.svelte
    MonthDetail.svelte
    Investments.svelte
    Settings.svelte
    Onboarding.svelte
tests/
  storage.test.ts
  money.test.ts
  rates.test.ts
  theme.test.ts
  i18n.test.ts
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/App.svelte`, `src/app.css`, `.gitignore`

- [ ] **Step 1: Initialize git, set local identity, and Vite Svelte-TS template**

Run from `/home/bruno/Development/bruno/financial_management`:
```bash
git init
git config user.email "brunovinissouza@gmail.com"
git config user.name "BrunoVini"
npm create vite@latest . -- --template svelte-ts
# When prompted, accept current directory non-empty (the spec docs are already here)
npm install
```

The two `git config` commands set identity **locally for this repo only** — the global config is left untouched.

- [ ] **Step 2: Add runtime + dev dependencies**

```bash
npm install svelte-spa-router lucide-svelte
npm install -D vitest @testing-library/svelte @testing-library/jest-dom jsdom \
  eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-plugin-svelte svelte-eslint-parser \
  prettier prettier-plugin-svelte
```

- [ ] **Step 3: Replace `package.json` scripts**

Edit `package.json` — the `scripts` block:
```json
"scripts": {
  "dev": "vite",
  "build": "svelte-check --tsconfig ./tsconfig.json && vite build",
  "preview": "vite preview",
  "check": "svelte-check --tsconfig ./tsconfig.json",
  "test": "vitest run",
  "test:watch": "vitest",
  "lint": "eslint . --ext .ts,.svelte",
  "format": "prettier --write \"src/**/*.{ts,svelte,css}\""
}
```

- [ ] **Step 4: Configure Vite for GitHub Pages base path + Vitest**

Replace `vite.config.ts`:
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  base: process.env.GITHUB_PAGES === 'true' ? '/financial_management/' : '/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

- [ ] **Step 5: Replace `src/App.svelte` with a placeholder**

```svelte
<script lang="ts">
  // Replaced in later tasks with router + shell.
</script>

<main>
  <h1>Financial Management</h1>
  <p>Bootstrapping…</p>
</main>
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```
Expected: Vite prints a local URL and serves the placeholder without errors. Stop with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + Svelte + TypeScript project"
```

---

## Task 2: ESLint, Prettier, max-lines Rule

**Files:**
- Create: `.eslintrc.cjs`, `.eslintignore`, `.prettierrc`, `.prettierignore`

- [ ] **Step 1: Write `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', extraFileExtensions: ['.svelte'] },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { browser: true, es2022: true, node: true },
  rules: {
    'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: { parser: '@typescript-eslint/parser' },
      extends: ['plugin:svelte/recommended'],
    },
    { files: ['tests/**/*.ts', '**/*.test.ts'], rules: { 'max-lines': 'off' } },
  ],
};
```

- [ ] **Step 2: Write `.eslintignore`**

```
dist
node_modules
.svelte-kit
.superpowers
```

- [ ] **Step 3: Write `.prettierrc`**

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-svelte"],
  "overrides": [{ "files": "*.svelte", "options": { "parser": "svelte" } }]
}
```

- [ ] **Step 4: Write `.prettierignore`**

```
dist
node_modules
.svelte-kit
.superpowers
docs/superpowers/specs
docs/superpowers/plans
```

- [ ] **Step 5: Run lint to verify config**

```bash
npm run lint
```
Expected: PASS (or only style warnings on the placeholder App.svelte). Fix any errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: configure ESLint, Prettier, and max-lines rule"
```

---

## Task 3: Vitest Setup File

**Files:**
- Create: `tests/setup.ts`

- [ ] **Step 1: Write the setup file**

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});
```

- [ ] **Step 2: Run vitest to confirm it boots**

```bash
npm test
```
Expected: "No test files found" — that's fine.

- [ ] **Step 3: Commit**

```bash
git add tests/setup.ts
git commit -m "test: add Vitest setup with localStorage reset"
```

---

## Task 4: Core Types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Write the types module**

```ts
export type Currency = string; // ISO 4217, e.g. 'BRL' | 'USD' | 'CAD'
export type MonthKey = string; // 'YYYY-MM'
export type Language = 'pt-BR' | 'en';
export type ThemeName = 'dark' | 'light';
export type MonthStatus = 'open' | 'grace' | 'closed';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  archived: boolean;
}

export interface Account {
  id: string;
  name: string;
  currency: Currency;
  openingBalance: number;
}

export interface Income {
  id: string;
  amount: number;
  currency: Currency;
  categoryId?: string;
  note?: string;
  date: string; // ISO
}

export interface Expense {
  id: string;
  amount: number;
  currency: Currency;
  categoryId: string;
  accountId: string;
  note?: string;
  date: string;
}

export interface FxTransfer {
  id: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  fromAmount: number;
  toAmount: number;
  rate: number;
  date: string;
}

export interface Salary {
  amount: number;
  currency: Currency;
  rateToDisplay: number;
  receivedAt: string;
}

export interface Month {
  key: MonthKey;
  status: MonthStatus;
  closedAt?: string;
  editedAt?: string;
  salary: Salary | null;
  extraIncomes: Income[];
  expenses: Expense[];
  fxTransfers: FxTransfer[];
  openingBalances: Record<Currency, number>;
  closingBalances?: Record<Currency, number>;
}

export interface Holding {
  id: string;
  name: string;
  type: string;
  currency: Currency;
  createdAt: string;
}

export interface Contribution {
  id: string;
  holdingId: string;
  monthKey: MonthKey;
  amount: number;
  currency: Currency;
  date: string;
}

export interface Snapshot {
  id: string;
  holdingId: string;
  monthKey: MonthKey;
  marketValue: number;
  currency: Currency;
  takenAt: string;
}

export interface Settings {
  language: Language;
  theme: ThemeName;
  displayCurrency: Currency;
  salaryCurrency: Currency;
  salaryAmount: number;
  salaryDayOfMonth: number;
  activeCurrencies: Currency[];
  onboarded: boolean;
}

export interface RatesCache {
  fetchedAt: string; // 'YYYY-MM-DD'
  base: 'EUR';
  rates: Record<Currency, number>;
}

export interface Store {
  schemaVersion: 1;
  settings: Settings;
  categories: { expense: Category[]; investment: Category[] };
  accounts: Account[];
  months: Record<MonthKey, Month>;
  investments: { holdings: Holding[]; contributions: Contribution[]; snapshots: Snapshot[] };
  ratesCache: RatesCache | null;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run check
```
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): define core domain types"
```

---

## Task 5: Storage Wrapper (TDD)

**Files:**
- Create: `tests/storage.test.ts`, `src/lib/storage.ts`

- [ ] **Step 1: Write failing tests**

`tests/storage.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { loadStore, saveStore, defaultStore, ROOT_KEY } from '../src/lib/storage';

describe('storage', () => {
  it('returns defaultStore when nothing is persisted', () => {
    const store = loadStore();
    expect(store.schemaVersion).toBe(1);
    expect(store.settings.onboarded).toBe(false);
  });

  it('round-trips a store through localStorage', () => {
    const s = defaultStore();
    s.settings.language = 'en';
    saveStore(s);
    const loaded = loadStore();
    expect(loaded.settings.language).toBe('en');
  });

  it('persists under the versioned root key', () => {
    saveStore(defaultStore());
    expect(localStorage.getItem(ROOT_KEY)).not.toBeNull();
  });

  it('falls back to defaultStore on malformed JSON', () => {
    localStorage.setItem(ROOT_KEY, '{not json');
    const store = loadStore();
    expect(store.schemaVersion).toBe(1);
  });

  it('falls back to defaultStore when schemaVersion is missing', () => {
    localStorage.setItem(ROOT_KEY, JSON.stringify({ foo: 'bar' }));
    const store = loadStore();
    expect(store.schemaVersion).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- storage
```
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `src/lib/storage.ts`**

```ts
import type { Store } from './types';

export const ROOT_KEY = 'fm:v1';

export function defaultStore(): Store {
  return {
    schemaVersion: 1,
    settings: {
      language: 'pt-BR',
      theme: 'dark',
      displayCurrency: 'BRL',
      salaryCurrency: 'BRL',
      salaryAmount: 0,
      salaryDayOfMonth: 1,
      activeCurrencies: ['BRL'],
      onboarded: false,
    },
    categories: { expense: [], investment: [] },
    accounts: [],
    months: {},
    investments: { holdings: [], contributions: [], snapshots: [] },
    ratesCache: null,
  };
}

export function loadStore(): Store {
  const raw = localStorage.getItem(ROOT_KEY);
  if (!raw) return defaultStore();
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion === 1) return parsed as Store;
    return defaultStore();
  } catch {
    return defaultStore();
  }
}

export function saveStore(store: Store): void {
  localStorage.setItem(ROOT_KEY, JSON.stringify(store));
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- storage
```
Expected: 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/storage.test.ts src/lib/storage.ts
git commit -m "feat(storage): versioned localStorage wrapper with defaults"
```

---

## Task 6: Money Utilities (TDD)

**Files:**
- Create: `tests/money.test.ts`, `src/lib/money.ts`

- [ ] **Step 1: Write failing tests**

`tests/money.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { convert, formatMoney } from '../src/lib/money';

const ratesEurBase = { EUR: 1, BRL: 5.5, USD: 1.1, CAD: 1.5 };

describe('convert', () => {
  it('returns the same amount when from and to are identical', () => {
    expect(convert(100, 'BRL', 'BRL', ratesEurBase)).toBe(100);
  });

  it('converts USD to BRL through the EUR base', () => {
    // 100 USD -> EUR: 100 / 1.1; -> BRL: * 5.5
    const result = convert(100, 'USD', 'BRL', ratesEurBase);
    expect(result).toBeCloseTo((100 / 1.1) * 5.5, 4);
  });

  it('converts BRL to USD', () => {
    const result = convert(550, 'BRL', 'USD', ratesEurBase);
    expect(result).toBeCloseTo((550 / 5.5) * 1.1, 4);
  });

  it('returns NaN when a rate is missing', () => {
    expect(convert(1, 'XYZ', 'BRL', ratesEurBase)).toBeNaN();
  });
});

describe('formatMoney', () => {
  it('formats BRL in pt-BR with R$ prefix', () => {
    expect(formatMoney(1234.5, 'BRL', 'pt-BR')).toContain('R$');
  });

  it('formats USD in en with $ prefix', () => {
    expect(formatMoney(1234.5, 'USD', 'en')).toContain('$');
  });
});
```

- [ ] **Step 2: Verify they fail**

```bash
npm test -- money
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/money.ts`**

```ts
import type { Currency, Language } from './types';

export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  ratesEurBase: Record<Currency, number>,
): number {
  if (from === to) return amount;
  const fromRate = ratesEurBase[from];
  const toRate = ratesEurBase[to];
  if (fromRate === undefined || toRate === undefined) return NaN;
  return (amount / fromRate) * toRate;
}

const LOCALE_BY_LANG: Record<Language, string> = {
  'pt-BR': 'pt-BR',
  en: 'en-US',
};

export function formatMoney(amount: number, currency: Currency, language: Language): string {
  return new Intl.NumberFormat(LOCALE_BY_LANG[language], {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

- [ ] **Step 4: Verify pass**

```bash
npm test -- money
```
Expected: 6 PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/money.test.ts src/lib/money.ts
git commit -m "feat(money): conversion via EUR base + locale-aware formatting"
```

---

## Task 7: Rates Client + Daily Cache (TDD)

**Files:**
- Create: `tests/rates.test.ts`, `src/lib/rates.ts`

- [ ] **Step 1: Write failing tests**

`tests/rates.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureRates, todayIso, FRANKFURTER_URL } from '../src/lib/rates';
import { defaultStore, saveStore, loadStore } from '../src/lib/storage';

describe('rates', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-02T12:00:00Z'));
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({ base: 'EUR', date: '2026-05-02', rates: { BRL: 5.5, USD: 1.1, CAD: 1.5 } }),
          { status: 200 },
        ),
      ),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('fetches and caches when cache is empty', async () => {
    const store = defaultStore();
    saveStore(store);
    const result = await ensureRates(['BRL', 'USD', 'CAD']);
    expect(result.rates.BRL).toBe(5.5);
    expect(loadStore().ratesCache?.fetchedAt).toBe(todayIso());
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('skips network when cache fetchedAt is today', async () => {
    const store = defaultStore();
    store.ratesCache = { fetchedAt: todayIso(), base: 'EUR', rates: { BRL: 5.5 } };
    saveStore(store);
    await ensureRates(['BRL']);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('refetches when cache is from a previous day', async () => {
    const store = defaultStore();
    store.ratesCache = { fetchedAt: '2026-05-01', base: 'EUR', rates: { BRL: 5.0 } };
    saveStore(store);
    await ensureRates(['BRL', 'USD', 'CAD']);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to stale cache on fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network'); }));
    const store = defaultStore();
    store.ratesCache = { fetchedAt: '2026-04-01', base: 'EUR', rates: { BRL: 5.0 } };
    saveStore(store);
    const result = await ensureRates(['BRL']);
    expect(result.rates.BRL).toBe(5.0);
    expect(result.stale).toBe(true);
  });

  it('builds the frankfurter URL with the requested symbols', async () => {
    saveStore(defaultStore());
    await ensureRates(['BRL', 'USD']);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${FRANKFURTER_URL}?from=EUR&to=BRL,USD`),
    );
  });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- rates
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/rates.ts`**

```ts
import type { Currency, RatesCache } from './types';
import { loadStore, saveStore } from './storage';

export const FRANKFURTER_URL = 'https://api.frankfurter.app/latest';

export interface RatesResult {
  rates: Record<Currency, number>;
  fetchedAt: string;
  stale: boolean;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchRates(symbols: Currency[]): Promise<RatesCache> {
  const url = `${FRANKFURTER_URL}?from=EUR&to=${symbols.join(',')}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`frankfurter ${res.status}`);
  const json = (await res.json()) as { base: 'EUR'; rates: Record<Currency, number> };
  return { fetchedAt: todayIso(), base: 'EUR', rates: { EUR: 1, ...json.rates } };
}

export async function ensureRates(symbols: Currency[]): Promise<RatesResult> {
  const store = loadStore();
  const cache = store.ratesCache;
  if (cache && cache.fetchedAt === todayIso()) {
    return { rates: cache.rates, fetchedAt: cache.fetchedAt, stale: false };
  }
  try {
    const fresh = await fetchRates(symbols);
    store.ratesCache = fresh;
    saveStore(store);
    return { rates: fresh.rates, fetchedAt: fresh.fetchedAt, stale: false };
  } catch {
    if (cache) return { rates: cache.rates, fetchedAt: cache.fetchedAt, stale: true };
    throw new Error('rates unavailable and no cache');
  }
}

export function clearRatesCache(): void {
  const store = loadStore();
  store.ratesCache = null;
  saveStore(store);
}
```

- [ ] **Step 4: Verify pass**

```bash
npm test -- rates
```
Expected: 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/rates.test.ts src/lib/rates.ts
git commit -m "feat(rates): frankfurter client with daily cache and stale fallback"
```

---

## Task 8: Theme Tokens

**Files:**
- Create: `src/theme/tokens.ts`, `src/theme/dark.ts`, `src/theme/light.ts`

- [ ] **Step 1: Write `src/theme/tokens.ts`**

```ts
export const tokens = {
  spacing: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '24px', 6: '32px', 7: '48px' },
  radius: { sm: '4px', md: '8px', lg: '12px', xl: '16px', xxl: '24px', pill: '999px' },
  type: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif',
    size: {
      xs: 'clamp(0.72rem, 0.7rem + 0.1vw, 0.78rem)',
      sm: 'clamp(0.82rem, 0.8rem + 0.1vw, 0.9rem)',
      md: 'clamp(0.95rem, 0.92rem + 0.15vw, 1.05rem)',
      lg: 'clamp(1.15rem, 1.1rem + 0.25vw, 1.3rem)',
      xl: 'clamp(1.5rem, 1.4rem + 0.5vw, 1.85rem)',
      xxl: 'clamp(2rem, 1.8rem + 1vw, 2.6rem)',
    },
    weight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
  motion: { fast: '120ms', base: '200ms', slow: '320ms' },
  z: { nav: 10, modal: 50, toast: 60 },
} as const;

export type Tokens = typeof tokens;
```

- [ ] **Step 2: Write `src/theme/dark.ts`**

```ts
import type { Palette } from './index';

export const dark: Palette = {
  name: 'dark',
  bg: { base: '#0b0a14', raised: '#13111f', glass: 'rgba(255,255,255,0.06)' },
  border: { subtle: 'rgba(255,255,255,0.08)', strong: 'rgba(255,255,255,0.16)' },
  text: { primary: '#e7e5f0', secondary: '#a8a5b8', muted: '#6b6880' },
  accent: {
    primary: '#a855f7',
    secondary: '#ec4899',
    gradient: 'linear-gradient(135deg, #a855f7, #ec4899)',
  },
  semantic: { positive: '#4ade80', negative: '#f87171', warning: '#fbbf24', info: '#60a5fa' },
  currency: { BRL: '#22c55e', USD: '#3b82f6', CAD: '#ef4444' },
  shadow: {
    glass: '0 8px 32px rgba(0,0,0,0.4)',
    glow: '0 0 40px rgba(168,85,247,0.15)',
  },
};
```

- [ ] **Step 3: Write `src/theme/light.ts`**

```ts
import type { Palette } from './index';

export const light: Palette = {
  name: 'light',
  bg: { base: '#f7f6fb', raised: '#ffffff', glass: 'rgba(255,255,255,0.7)' },
  border: { subtle: 'rgba(15,15,40,0.08)', strong: 'rgba(15,15,40,0.18)' },
  text: { primary: '#15131f', secondary: '#4a4860', muted: '#7a7890' },
  accent: {
    primary: '#7c3aed',
    secondary: '#db2777',
    gradient: 'linear-gradient(135deg, #7c3aed, #db2777)',
  },
  semantic: { positive: '#16a34a', negative: '#dc2626', warning: '#d97706', info: '#2563eb' },
  currency: { BRL: '#16a34a', USD: '#2563eb', CAD: '#dc2626' },
  shadow: {
    glass: '0 8px 24px rgba(15,15,40,0.08)',
    glow: '0 0 32px rgba(124,58,237,0.18)',
  },
};
```

- [ ] **Step 4: Run check**

```bash
npm run check
```
Expected: errors about missing `Palette` export — that's fine, fixed in Task 9.

- [ ] **Step 5: Skip commit (paired with Task 9)**

---

## Task 9: Theme Store + CSS Variables (TDD)

**Files:**
- Create: `tests/theme.test.ts`, `src/theme/index.ts`

- [ ] **Step 1: Write failing tests**

`tests/theme.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { theme, setTheme, applyThemeToDocument, type Palette } from '../src/theme/index';

describe('theme', () => {
  it('starts in dark mode by default', () => {
    expect(get(theme).name).toBe('dark');
  });

  it('switches to light when setTheme is called', () => {
    setTheme('light');
    expect(get(theme).name).toBe('light');
  });

  it('exposes palette structure for both themes', () => {
    setTheme('dark');
    const dark: Palette = get(theme);
    expect(dark.bg.base).toBeTruthy();
    expect(dark.accent.primary).toBeTruthy();
  });

  it('applies palette to document as CSS custom properties', () => {
    setTheme('dark');
    applyThemeToDocument(get(theme));
    const value = document.documentElement.style.getPropertyValue('--bg-base');
    expect(value).toBeTruthy();
  });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- theme
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/theme/index.ts`**

```ts
import { writable, get } from 'svelte/store';
import { dark } from './dark';
import { light } from './light';
import type { ThemeName } from '../lib/types';

export interface Palette {
  name: ThemeName;
  bg: { base: string; raised: string; glass: string };
  border: { subtle: string; strong: string };
  text: { primary: string; secondary: string; muted: string };
  accent: { primary: string; secondary: string; gradient: string };
  semantic: { positive: string; negative: string; warning: string; info: string };
  currency: Record<string, string>;
  shadow: { glass: string; glow: string };
}

const PALETTES: Record<ThemeName, Palette> = { dark, light };

export const theme = writable<Palette>(PALETTES.dark);

export function setTheme(name: ThemeName): void {
  theme.set(PALETTES[name]);
}

export function applyThemeToDocument(palette: Palette): void {
  const root = document.documentElement;
  root.style.setProperty('--bg-base', palette.bg.base);
  root.style.setProperty('--bg-raised', palette.bg.raised);
  root.style.setProperty('--bg-glass', palette.bg.glass);
  root.style.setProperty('--border-subtle', palette.border.subtle);
  root.style.setProperty('--border-strong', palette.border.strong);
  root.style.setProperty('--text-primary', palette.text.primary);
  root.style.setProperty('--text-secondary', palette.text.secondary);
  root.style.setProperty('--text-muted', palette.text.muted);
  root.style.setProperty('--accent-primary', palette.accent.primary);
  root.style.setProperty('--accent-secondary', palette.accent.secondary);
  root.style.setProperty('--accent-gradient', palette.accent.gradient);
  root.style.setProperty('--positive', palette.semantic.positive);
  root.style.setProperty('--negative', palette.semantic.negative);
  root.style.setProperty('--warning', palette.semantic.warning);
  root.style.setProperty('--info', palette.semantic.info);
  root.style.setProperty('--shadow-glass', palette.shadow.glass);
  root.style.setProperty('--shadow-glow', palette.shadow.glow);
  root.dataset.theme = palette.name;
}

export { get };
```

- [ ] **Step 4: Verify pass**

```bash
npm test -- theme
```
Expected: 4 PASS.

- [ ] **Step 5: Commit (Tasks 8 + 9 together)**

```bash
git add src/theme tests/theme.test.ts
git commit -m "feat(theme): tokens + dark/light palettes + reactive store"
```

---

## Task 10: Global Stylesheet (CSS variables)

**Files:**
- Create: `src/app.css`

- [ ] **Step 1: Write `src/app.css`**

```css
:root {
  --bg-base: #0b0a14;
  --bg-raised: #13111f;
  --bg-glass: rgba(255, 255, 255, 0.06);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.16);
  --text-primary: #e7e5f0;
  --text-secondary: #a8a5b8;
  --text-muted: #6b6880;
  --accent-primary: #a855f7;
  --accent-secondary: #ec4899;
  --accent-gradient: linear-gradient(135deg, #a855f7, #ec4899);
  --positive: #4ade80;
  --negative: #f87171;
  --warning: #fbbf24;
  --info: #60a5fa;
  --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.4);
  --shadow-glow: 0 0 40px rgba(168, 85, 247, 0.15);
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-xxl: 24px;
  --radius-pill: 999px;
  --motion-fast: 120ms;
  --motion-base: 200ms;
  --motion-slow: 320ms;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background: var(--bg-base);
  color: var(--text-primary);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  min-height: 100vh;
}

a {
  color: var(--accent-primary);
}

button {
  font: inherit;
  color: inherit;
  cursor: pointer;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.001ms !important;
    animation-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 2: Wire it into `src/main.ts`**

Replace `src/main.ts`:
```ts
import './app.css';
import App from './App.svelte';

const app = new App({ target: document.getElementById('app')! });
export default app;
```

- [ ] **Step 3: Run dev to verify visual**

```bash
npm run dev
```
Expected: page loads with dark background and light text.

- [ ] **Step 4: Commit**

```bash
git add src/app.css src/main.ts
git commit -m "feat(theme): global stylesheet with CSS custom properties"
```

---

## Task 11: i18n Module (TDD)

**Files:**
- Create: `tests/i18n.test.ts`, `src/i18n/pt-br.ts`, `src/i18n/en.ts`, `src/i18n/index.ts`

- [ ] **Step 1: Write failing tests**

`tests/i18n.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { locale, setLocale, t, detectLocale } from '../src/i18n/index';

describe('i18n', () => {
  it('defaults to pt-BR', () => {
    expect(get(locale)).toBe('pt-BR');
  });

  it('switches locale and resolves translations', () => {
    setLocale('en');
    expect(get(t)('nav.overview')).toBe('Overview');
    setLocale('pt-BR');
    expect(get(t)('nav.overview')).toBe('Visão geral');
  });

  it('returns the key when translation is missing', () => {
    expect(get(t)('missing.key')).toBe('missing.key');
  });

  it('detectLocale returns pt-BR for pt navigator language', () => {
    expect(detectLocale('pt-BR')).toBe('pt-BR');
    expect(detectLocale('pt')).toBe('pt-BR');
  });

  it('detectLocale returns en otherwise', () => {
    expect(detectLocale('fr-FR')).toBe('en');
    expect(detectLocale('en-US')).toBe('en');
  });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- i18n
```
Expected: FAIL.

- [ ] **Step 3: Write `src/i18n/pt-br.ts`**

```ts
export const ptBr = {
  'nav.overview': 'Visão geral',
  'nav.months': 'Meses',
  'nav.investments': 'Investimentos',
  'nav.settings': 'Configurações',
  'app.title': 'Gestão financeira',
  'app.loading': 'Carregando…',
};
```

- [ ] **Step 4: Write `src/i18n/en.ts`**

```ts
export const en = {
  'nav.overview': 'Overview',
  'nav.months': 'Months',
  'nav.investments': 'Investments',
  'nav.settings': 'Settings',
  'app.title': 'Financial Management',
  'app.loading': 'Loading…',
};
```

- [ ] **Step 5: Write `src/i18n/index.ts`**

```ts
import { derived, writable, get } from 'svelte/store';
import type { Language } from '../lib/types';
import { ptBr } from './pt-br';
import { en } from './en';

const DICTS: Record<Language, Record<string, string>> = { 'pt-BR': ptBr, en };

export const locale = writable<Language>('pt-BR');

export function setLocale(next: Language): void {
  locale.set(next);
}

export const t = derived(locale, ($locale) => {
  const dict = DICTS[$locale];
  return (key: string): string => dict[key] ?? key;
});

export function detectLocale(navLanguage: string): Language {
  return navLanguage.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
}

export { get };
```

- [ ] **Step 6: Verify pass**

```bash
npm test -- i18n
```
Expected: 5 PASS.

- [ ] **Step 7: Commit**

```bash
git add tests/i18n.test.ts src/i18n
git commit -m "feat(i18n): pt-BR and en dictionaries with reactive locale store"
```

---

## Task 12: Sidebar + BottomNav Components

**Files:**
- Create: `src/components/Sidebar.svelte`, `src/components/BottomNav.svelte`

- [ ] **Step 1: Write `src/components/Sidebar.svelte`**

```svelte
<script lang="ts">
  import { LayoutDashboard, Calendar, TrendingUp, Settings as Cog } from 'lucide-svelte';
  import { t } from '../i18n';
  import { link, location } from 'svelte-spa-router';

  const items = [
    { href: '/', icon: LayoutDashboard, key: 'nav.overview' },
    { href: '/months', icon: Calendar, key: 'nav.months' },
    { href: '/investments', icon: TrendingUp, key: 'nav.investments' },
    { href: '/settings', icon: Cog, key: 'nav.settings' },
  ];
</script>

<aside>
  <nav>
    {#each items as item}
      <a
        href={item.href}
        use:link
        class:active={$location === item.href || (item.href !== '/' && $location.startsWith(item.href))}
      >
        <svelte:component this={item.icon} size={18} />
        <span>{$t(item.key)}</span>
      </a>
    {/each}
  </nav>
</aside>

<style>
  aside {
    width: 220px;
    padding: var(--space-5) var(--space-4);
    border-right: 1px solid var(--border-subtle);
    background: var(--bg-raised);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  nav {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  a {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    text-decoration: none;
    transition: background var(--motion-fast), color var(--motion-fast);
  }
  a:hover {
    background: var(--bg-glass);
    color: var(--text-primary);
  }
  a.active {
    background: var(--accent-gradient);
    color: white;
  }
  @media (max-width: 768px) {
    aside { display: none; }
  }
</style>
```

- [ ] **Step 2: Write `src/components/BottomNav.svelte`**

```svelte
<script lang="ts">
  import { LayoutDashboard, Calendar, TrendingUp, Settings as Cog } from 'lucide-svelte';
  import { t } from '../i18n';
  import { link, location } from 'svelte-spa-router';

  const items = [
    { href: '/', icon: LayoutDashboard, key: 'nav.overview' },
    { href: '/months', icon: Calendar, key: 'nav.months' },
    { href: '/investments', icon: TrendingUp, key: 'nav.investments' },
    { href: '/settings', icon: Cog, key: 'nav.settings' },
  ];
</script>

<nav>
  {#each items as item}
    <a
      href={item.href}
      use:link
      class:active={$location === item.href || (item.href !== '/' && $location.startsWith(item.href))}
    >
      <svelte:component this={item.icon} size={20} />
      <span>{$t(item.key)}</span>
    </a>
  {/each}
</nav>

<style>
  nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    background: var(--bg-raised);
    border-top: 1px solid var(--border-subtle);
    padding: var(--space-2);
    gap: var(--space-1);
    justify-content: space-around;
    z-index: 10;
  }
  a {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--space-2);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 10px;
    min-height: 44px;
  }
  a.active {
    color: var(--accent-primary);
  }
  @media (max-width: 768px) {
    nav { display: flex; }
  }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components
git commit -m "feat(components): Sidebar and BottomNav with active state"
```

---

## Task 13: Placeholder Route Pages

**Files:**
- Create: `src/routes/Overview.svelte`, `src/routes/Months.svelte`, `src/routes/MonthDetail.svelte`, `src/routes/Investments.svelte`, `src/routes/Settings.svelte`, `src/routes/Onboarding.svelte`

- [ ] **Step 1: Write each route as a minimal placeholder**

`src/routes/Overview.svelte`:
```svelte
<script lang="ts">
  import { t } from '../i18n';
</script>

<section>
  <h1>{$t('nav.overview')}</h1>
  <p>Coming in Phase 2.</p>
</section>

<style>
  section { padding: var(--space-5); }
  h1 { font-size: var(--space-6); margin: 0 0 var(--space-4); }
</style>
```

`src/routes/Months.svelte`:
```svelte
<script lang="ts">
  import { t } from '../i18n';
</script>

<section>
  <h1>{$t('nav.months')}</h1>
  <p>Coming in Phase 2.</p>
</section>

<style>
  section { padding: var(--space-5); }
  h1 { font-size: var(--space-6); margin: 0 0 var(--space-4); }
</style>
```

`src/routes/MonthDetail.svelte`:
```svelte
<script lang="ts">
  import { params } from 'svelte-spa-router';
</script>

<section>
  <h1>Month {$params?.key ?? ''}</h1>
  <p>Coming in Phase 2.</p>
</section>

<style>
  section { padding: var(--space-5); }
  h1 { font-size: var(--space-6); margin: 0 0 var(--space-4); }
</style>
```

`src/routes/Investments.svelte`:
```svelte
<script lang="ts">
  import { t } from '../i18n';
</script>

<section>
  <h1>{$t('nav.investments')}</h1>
  <p>Coming in Phase 3.</p>
</section>

<style>
  section { padding: var(--space-5); }
  h1 { font-size: var(--space-6); margin: 0 0 var(--space-4); }
</style>
```

`src/routes/Settings.svelte`:
```svelte
<script lang="ts">
  import { t, setLocale, locale } from '../i18n';
  import { setTheme, applyThemeToDocument, theme } from '../theme';
  import type { Language, ThemeName } from '../lib/types';

  function changeLocale(e: Event) {
    setLocale((e.target as HTMLSelectElement).value as Language);
  }

  function changeTheme(e: Event) {
    const name = (e.target as HTMLSelectElement).value as ThemeName;
    setTheme(name);
    applyThemeToDocument($theme);
  }
</script>

<section>
  <h1>{$t('nav.settings')}</h1>
  <label>
    Language
    <select on:change={changeLocale} value={$locale}>
      <option value="pt-BR">Português</option>
      <option value="en">English</option>
    </select>
  </label>
  <label>
    Theme
    <select on:change={changeTheme} value={$theme.name}>
      <option value="dark">Dark</option>
      <option value="light">Light</option>
    </select>
  </label>
</section>

<style>
  section { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); max-width: 480px; }
  h1 { font-size: var(--space-6); margin: 0; }
  label { display: flex; flex-direction: column; gap: var(--space-2); color: var(--text-secondary); }
  select { padding: var(--space-2) var(--space-3); background: var(--bg-raised); color: var(--text-primary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
</style>
```

`src/routes/Onboarding.svelte`:
```svelte
<section>
  <h1>Welcome</h1>
  <p>Onboarding wizard coming in Phase 2.</p>
</section>

<style>
  section { padding: var(--space-5); }
  h1 { font-size: var(--space-6); margin: 0 0 var(--space-4); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/routes
git commit -m "feat(routes): placeholder pages for all routes"
```

---

## Task 14: App Shell with Router

**Files:**
- Modify: `src/App.svelte`

- [ ] **Step 1: Replace `src/App.svelte`**

```svelte
<script lang="ts">
  import Router from 'svelte-spa-router';
  import Sidebar from './components/Sidebar.svelte';
  import BottomNav from './components/BottomNav.svelte';
  import Overview from './routes/Overview.svelte';
  import Months from './routes/Months.svelte';
  import MonthDetail from './routes/MonthDetail.svelte';
  import Investments from './routes/Investments.svelte';
  import Settings from './routes/Settings.svelte';
  import Onboarding from './routes/Onboarding.svelte';
  import { theme, applyThemeToDocument } from './theme';
  import { onMount } from 'svelte';

  const routes = {
    '/': Overview,
    '/months': Months,
    '/months/:key': MonthDetail,
    '/investments': Investments,
    '/settings': Settings,
    '/onboarding': Onboarding,
  };

  onMount(() => {
    applyThemeToDocument($theme);
  });

  $: if (typeof document !== 'undefined') applyThemeToDocument($theme);
</script>

<div class="layout">
  <Sidebar />
  <main>
    <Router {routes} />
  </main>
  <BottomNav />
</div>

<style>
  .layout {
    display: flex;
    min-height: 100vh;
  }
  main {
    flex: 1;
    padding-bottom: 80px;
  }
  @media (min-width: 769px) {
    main { padding-bottom: 0; }
  }
</style>
```

- [ ] **Step 2: Run dev and click through each route**

```bash
npm run dev
```
Expected: each nav item navigates to its placeholder; theme + language switches work in Settings.

- [ ] **Step 3: Run lint and check**

```bash
npm run lint && npm run check && npm test
```
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add src/App.svelte
git commit -m "feat(app): shell with hash routing and theme application"
```

---

## Task 15: GitHub Pages Deploy Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
        env:
          GITHUB_PAGES: 'true'
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify the production build runs locally**

```bash
GITHUB_PAGES=true npm run build && npm run preview
```
Expected: build succeeds, preview serves from a `/financial_management/` base.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Pages deploy workflow"
```

---

## Task 16: README + Final Verification

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write a minimal README**

```markdown
# Financial Management

A static, client-side personal finance app. Multi-currency, dark/light themed, PT-BR + EN, persisted in `localStorage`. Deployed to GitHub Pages.

## Develop

```bash
npm install
npm run dev
```

## Test / Lint / Build

```bash
npm test
npm run lint
npm run build
```

## Deploy

Push to `main`. The GitHub Action builds and publishes to GitHub Pages.

## Spec / Plans

See `docs/superpowers/specs/` and `docs/superpowers/plans/`.
```

- [ ] **Step 2: Run the full pipeline locally**

```bash
npm run lint && npm run check && npm test && npm run build
```
Expected: every step passes.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README with dev / test / deploy instructions"
```

- [ ] **Step 4: (Optional) Push and verify deploy**

After the user creates a GitHub repo and adds the remote:
```bash
git push -u origin main
```
Then check the Actions tab for the `Deploy to GitHub Pages` run.

---

## Self-Review Notes

- **Spec coverage (Phase 1 scope):** stack ✓, file layout ✓, theme tokens ✓, i18n ✓, storage versioned ✓, money utils ✓, rates client ✓, app shell ✓, deploy ✓, ESLint + 200-line ✓, Prettier ✓. Out-of-scope (Phase 2/3): onboarding logic, month rollover, expenses/incomes UI, salary flow, investments, charts, export/import, command palette.
- **Placeholder check:** every code step contains the actual code; every command step has expected output.
- **Type consistency:** `Palette` exported from `theme/index.ts`, consumed by `dark.ts`/`light.ts`. `Language`, `ThemeName`, `Currency`, `MonthKey` defined once in `lib/types.ts` and referenced everywhere.
- **200-line check:** every file written above is under 200 lines.

---

## Phase 2 / 3 Preview

After Phase 1 ships, separate plans will cover:

- **Phase 2 (core flows):** db modules per domain (months/accounts/categories/investments), MoneyInput, CategoryPicker, Card components, Onboarding wizard, Overview real data, Months list, MonthDetail editing, Settings categories CRUD, expense/income/FX modals, salary-received flow, month rollover on app open.
- **Phase 3 (investments + polish):** Chart wrapper, Investments page with combined chart + per-holding cards, contribution + snapshot flows, export/import, command palette, keyboard shortcuts, accessibility sweep, swipe-to-delete, animations.
