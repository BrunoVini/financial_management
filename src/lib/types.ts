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
  // When set, the holding represents a crypto position. `coinId` is a
  // CoinGecko id (e.g. 'bitcoin') used to look up live prices, and
  // `coinAmount` is the quantity held in that coin's native unit.
  // Auto-snapshots compute marketValue = coinAmount × price(coinId, currency).
  coinId?: string;
  coinAmount?: number;
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

export interface Subscription {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  categoryId: string;
  accountId: string;
  dayOfMonth: number; // 1-31, clamped to month length on apply
  active: boolean;
  createdAt: string;
  appliedMonths: MonthKey[];
}

export interface InstallmentPlan {
  id: string;
  description: string;
  totalAmount: number;
  installmentCount: number;
  currency: Currency;
  accountId: string;
  categoryId: string;
  firstMonthKey: MonthKey;
  createdAt: string;
  // 0-based indices of installments already paid. Each pay action also
  // creates a real Expense in the corresponding month — `paidIndices`
  // here is just the bookkeeping needed to know what's left.
  paidIndices: number[];
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

export interface CryptoCache {
  fetchedAt: string; // 'YYYY-MM-DD'
  // prices[coinId][currencyCode] = price of 1 coin in that fiat currency.
  // Currency codes are lowercased to match CoinGecko's API (e.g. 'brl').
  prices: Record<string, Record<string, number>>;
}

export interface Store {
  schemaVersion: 1;
  settings: Settings;
  categories: { expense: Category[]; investment: Category[] };
  accounts: Account[];
  months: Record<MonthKey, Month>;
  investments: { holdings: Holding[]; contributions: Contribution[]; snapshots: Snapshot[] };
  installments: InstallmentPlan[];
  subscriptions: Subscription[];
  budgets: Record<string, number>;
  ratesCache: RatesCache | null;
  cryptoCache: CryptoCache | null;
}
