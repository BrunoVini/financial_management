<script lang="ts">
  import { link } from 'svelte-spa-router';
  import { t } from '@/i18n';
  import { appStore, settings } from '@/lib/appStore';
  import { holdingReturn } from '@/lib/db/investments';
  import { formatMoney } from '@/lib/money';
  import type { Holding } from '@/lib/types';

  // Show up to 3 holdings on Overview — link to the full Investments
  // page for the rest.
  let holdings = $derived($appStore.investments.holdings.slice(0, 3));

  function badgeFor(h: Holding): { label: string; tint: 'sage' | 'honey' | 'cream' } {
    if (h.coinId) return { label: 'BTC', tint: 'honey' };
    if (h.ticker) return { label: h.ticker, tint: 'sage' };
    if (h.yieldType) return { label: h.yieldType === 'cdi' ? 'CDI' : 'PRÉ', tint: 'sage' };
    const t = h.type.toLowerCase();
    if (t.includes('cripto') || t.includes('crypto')) return { label: 'CRYPTO', tint: 'honey' };
    if (t.includes('renda') || t.includes('fixed') || t.includes('bond') || t.includes('ipca'))
      return { label: 'RF', tint: 'sage' };
    if (t.includes('ação') || t.includes('açõe') || t.includes('stock') || t.includes('acci'))
      return { label: 'B3', tint: 'sage' };
    return { label: h.type.slice(0, 4).toUpperCase(), tint: 'cream' };
  }

  function summary(h: Holding) {
    return holdingReturn($appStore, h.id);
  }

  function pctText(pct: number, abs: number): string {
    const sign = abs >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1).replace('.', ',')} %`;
  }

  function qtyText(h: Holding): string {
    if (h.coinId && typeof h.coinAmount === 'number') {
      return `${h.coinAmount.toFixed(8).replace('.', ',')} BTC`;
    }
    if (h.ticker && typeof h.shareAmount === 'number') {
      return `${h.shareAmount} × ${h.ticker}`;
    }
    if (h.yieldType === 'fixed' && typeof h.yieldRate === 'number') {
      return `${(h.yieldRate * 100).toFixed(2).replace('.', ',')}% a.a.`;
    }
    if (h.yieldType === 'cdi' && typeof h.yieldRate === 'number') {
      return `${(h.yieldRate * 100).toFixed(0)}% do CDI`;
    }
    return h.type;
  }
</script>

{#if holdings.length > 0}
  <section class="block">
    <header class="block-head">
      <h2 class="section-title">{$t('nav.investments')}</h2>
      <a class="section-sub" href="/investments" use:link>
        {holdings.length === 1 ? '1 ativo' : `${holdings.length} ativos`} ·
        ver tudo →
      </a>
    </header>

    <div class="grid">
      {#each holdings as h (h.id)}
        {@const s = summary(h)}
        {@const b = badgeFor(h)}
        <article class="holding">
          <header class="head">
            <div class="title">
              <h3>{h.name}</h3>
              <span class="type">{h.type.toLowerCase()}</span>
            </div>
            <span class="badge" data-tint={b.tint}>{b.label}</span>
          </header>
          <div class="market">
            {formatMoney(s.marketValue, h.currency, $settings.language)}
          </div>
          <div class="qty">{qtyText(h)}</div>
          {#if s.contributed > 0}
            <div class="ret" data-tone={s.deltaAbsolute >= 0 ? 'pos' : 'neg'}>
              <span>{s.deltaAbsolute >= 0 ? '↗' : '↘'}</span>
              {s.deltaAbsolute >= 0 ? '+' : ''}{formatMoney(
                s.deltaAbsolute,
                h.currency,
                $settings.language,
              )}
              <span class="dot">·</span>
              <span>{pctText(s.deltaPercent, s.deltaAbsolute)}</span>
            </div>
          {/if}
        </article>
      {/each}
    </div>
  </section>
{/if}

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }
  @media (max-width: 880px) {
    .grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 480px) {
    .grid { grid-template-columns: 1fr; }
  }
  .holding {
    background: var(--bg-raised);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xxl);
    padding: 22px;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.7) inset,
      0 4px 14px rgba(46, 42, 38, 0.05);
  }
  :global([data-theme='dark']) .holding {
    box-shadow:
      0 1px 0 rgba(245, 239, 230, 0.04) inset,
      0 4px 14px rgba(0, 0, 0, 0.28);
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    gap: var(--space-2);
  }
  .title h3 {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 1.125rem;
    letter-spacing: -0.01em;
    color: var(--text-primary);
  }
  .title .type {
    display: block;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.78rem;
    color: var(--text-muted);
    margin-top: 2px;
  }
  .badge {
    background: rgba(124, 148, 116, 0.18);
    color: var(--positive);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
  }
  .badge[data-tint='honey'] {
    background: rgba(214, 168, 90, 0.22);
    color: var(--warning);
  }
  .badge[data-tint='cream'] {
    background: var(--bg-glass);
    color: var(--text-secondary);
  }
  .market {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 1.6rem;
    line-height: 1;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    color: var(--text-primary);
  }
  .qty {
    margin-top: 4px;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  .ret {
    margin-top: 14px;
    font-size: 0.86rem;
    font-weight: 600;
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
  }
  .ret[data-tone='pos'] { color: var(--positive); }
  .ret[data-tone='neg'] { color: var(--negative); }
  .ret .dot { opacity: 0.5; }
</style>
