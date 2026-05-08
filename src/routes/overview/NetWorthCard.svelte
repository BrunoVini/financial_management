<script lang="ts">
  import { t } from '@/i18n';
  import { formatMoney, convert } from '@/lib/money';
  import { settings, accounts, appStore } from '@/lib/appStore';
  import { accountBalance } from '@/lib/db/accounts';
  import { monthKey as toMonthKey } from '@/lib/db/months';
  import { holdingReturn } from '@/lib/db/investments';
  import { netWorthHistory } from '@/lib/charts/netWorthHistory';
  import type { Currency } from '@/lib/types';

  const today = new Date();
  const currentKey = $derived(toMonthKey(today));

  let perCurrency = $derived.by(() => {
    const out: Record<Currency, number> = {};
    for (const a of $accounts) {
      const bal = accountBalance($appStore, a.id, currentKey);
      out[a.currency] = (out[a.currency] ?? 0) + bal;
    }
    return out;
  });

  let total = $derived.by(() => {
    const rates = $appStore.ratesCache?.rates ?? {};
    let sum = 0;
    for (const [curr, amt] of Object.entries(perCurrency)) {
      const v = convert(amt, curr, $settings.displayCurrency, rates);
      if (Number.isFinite(v)) sum += v;
    }
    for (const h of $appStore.investments.holdings) {
      const r = holdingReturn($appStore, h.id);
      const v = convert(r.marketValue, h.currency, $settings.displayCurrency, rates);
      if (Number.isFinite(v)) sum += v;
    }
    return sum;
  });

  // Month-over-month delta — read the last two points of the 12-month
  // history series so the pill below the hero number tells the user
  // "where this came from".
  let delta = $derived.by(() => {
    const h = netWorthHistory($appStore, $settings.displayCurrency, today);
    if (h.values.length < 2) return null;
    const last = h.values[h.values.length - 1];
    const prev = h.values[h.values.length - 2];
    if (!Number.isFinite(prev) || prev === 0) return null;
    const abs = last - prev;
    const pct = (abs / prev) * 100;
    return { abs, pct, prevKey: h.keys[h.keys.length - 2] };
  });

  function safeConvert(amt: number, from: Currency): number | undefined {
    const rates = $appStore.ratesCache?.rates;
    if (!rates) return undefined;
    const v = convert(amt, from, $settings.displayCurrency, rates);
    return Number.isFinite(v) ? v : undefined;
  }

  function monthName(key: string): string {
    if (!key) return '';
    const [y, m] = key.split('-').map(Number);
    return new Intl.DateTimeFormat($settings.language === 'pt-BR' ? 'pt-BR' : $settings.language, {
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(y, m - 1, 1)));
  }
</script>

<section class="hero">
  <div class="kicker">{$t('overview.networth')}</div>
  <h2 class="number">
    {formatMoney(total, $settings.displayCurrency, $settings.language)}
  </h2>
  {#if delta}
    <div class="delta" data-tone={delta.abs >= 0 ? 'pos' : 'neg'}>
      <span class="arrow">{delta.abs >= 0 ? '↗' : '↘'}</span>
      <span class="text">
        {delta.abs >= 0 ? '+' : ''}{formatMoney(delta.abs, $settings.displayCurrency, $settings.language)}
        <span class="since">desde {monthName(delta.prevKey)}</span>
        <span class="dot">·</span>
        <span class="pct">{delta.pct >= 0 ? '+' : ''}{delta.pct.toFixed(1)} %</span>
      </span>
    </div>
  {/if}
  <div class="pills">
    {#each Object.entries(perCurrency) as [curr, amt] (curr)}
      <span class="pill">
        <span class="code">{curr}</span>
        <span class="amount">{formatMoney(amt, curr, $settings.language)}</span>
        {#if safeConvert(amt, curr) !== undefined && curr !== $settings.displayCurrency}
          <span class="conv">≈ {formatMoney(safeConvert(amt, curr) ?? 0, $settings.displayCurrency, $settings.language)}</span>
        {/if}
      </span>
    {/each}
  </div>
</section>

<style>
  .hero {
    background: var(--bg-raised);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xxl);
    padding: 44px 44px 36px;
    /* Inset top highlight + soft outer shadow = "raised paper" look */
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.7) inset,
      0 6px 22px rgba(46, 42, 38, 0.06);
  }
  :global([data-theme='dark']) .hero {
    box-shadow:
      0 1px 0 rgba(245, 239, 230, 0.04) inset,
      0 6px 22px rgba(0, 0, 0, 0.32);
  }
  @media (max-width: 600px) {
    .hero { padding: 28px 24px 24px; }
  }
  .kicker {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.95rem;
    color: var(--accent-primary);
    margin-bottom: 6px;
  }
  .number {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: clamp(2.4rem, 2rem + 2vw, 3.6rem);
    line-height: 0.95;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
    color: var(--text-primary);
  }
  .delta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: var(--space-3);
    background: rgba(124, 148, 116, 0.16);
    color: var(--accent-primary);
    padding: 6px 14px;
    border-radius: var(--radius-pill);
    font-size: 0.92rem;
    font-weight: 500;
  }
  .delta[data-tone='neg'] {
    background: rgba(180, 131, 122, 0.18);
    color: var(--negative);
  }
  .delta .arrow { font-size: 0.95rem; line-height: 1; }
  .delta .since { font-style: italic; opacity: 0.85; margin-left: 4px; font-weight: 400; }
  .delta .dot { opacity: 0.5; margin: 0 2px; }
  .delta .pct { font-weight: 600; font-variant-numeric: tabular-nums; }
  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: var(--space-4);
  }
  .pill {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    padding: 8px 14px;
    background: var(--bg-glass);
    border-radius: var(--radius-pill);
    font-variant-numeric: tabular-nums;
  }
  .code {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--text-muted);
  }
  .amount { font-weight: 600; font-size: 0.95rem; color: var(--text-primary); }
  .conv {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.82rem;
    color: var(--text-muted);
  }
</style>
