<script lang="ts">
  import { t } from '@/i18n';
  import { settings } from '@/lib/appStore';
  import type { Month, MonthStatus } from '@/lib/types';

  interface Props {
    month: Month;
    locked: boolean;
    onUnlock: () => void;
  }

  let { month, locked, onUnlock }: Props = $props();

  function statusLabel(status: MonthStatus): string {
    if (status === 'open') return $t('months.filter.open');
    if (status === 'grace') return $t('months.filter.grace');
    return $t('months.filter.closed');
  }

  function monthName(key: string): string {
    if (!key) return '';
    const [y, m] = key.split('-').map(Number);
    return new Intl.DateTimeFormat($settings.language === 'pt-BR' ? 'pt-BR' : $settings.language, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(y, m - 1, 1)));
  }
</script>

<header class="head">
  <div class="title-row">
    <h1>{monthName(month.key)}</h1>
    <span class="badge" data-status={month.status}>{statusLabel(month.status)}</span>
  </div>
  <span class="key">№ {month.key}</span>
  {#if locked}
    <div class="banner" role="alert">
      <span>{$t('monthDetail.closed.banner')}</span>
      <button type="button" class="primary" onclick={onUnlock}>
        {$t('monthDetail.closed.unlock')}
      </button>
    </div>
  {/if}
</header>

<style>
  .head {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-left: 8px;
  }
  .title-row {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: clamp(2rem, 1.8rem + 1vw, 2.6rem);
    letter-spacing: -0.025em;
    text-transform: capitalize;
    color: var(--text-primary);
  }
  .key {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.92rem;
    color: var(--text-muted);
    letter-spacing: 0.02em;
  }
  .badge {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    padding: 4px 12px;
    border-radius: var(--radius-pill);
    background: rgba(124, 148, 116, 0.18);
    color: var(--positive);
  }
  .badge[data-status='grace'] {
    background: rgba(168, 122, 58, 0.20);
    color: var(--warning);
  }
  .badge[data-status='closed'] {
    background: var(--bg-glass);
    color: var(--text-muted);
  }
  .banner {
    margin-top: var(--space-3);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    border: 1px solid rgba(168, 122, 58, 0.4);
    border-radius: var(--radius-lg);
    background: rgba(168, 122, 58, 0.10);
    color: var(--warning);
    font-family: var(--font-display);
    font-style: italic;
  }
  .primary {
    background: var(--accent-gradient);
    color: white;
    border: none;
    padding: 8px var(--space-4);
    border-radius: var(--radius-pill);
    cursor: pointer;
    min-height: 36px;
    font: inherit;
    font-style: normal;
    font-weight: 600;
  }
</style>
