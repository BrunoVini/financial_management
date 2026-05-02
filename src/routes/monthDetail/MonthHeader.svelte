<script lang="ts">
  import { t } from '@/i18n';
  import type { Month, MonthStatus } from '@/lib/types';

  interface Props {
    month: Month;
    locked: boolean;
    onUnlock: () => void;
  }

  let { month, locked, onUnlock }: Props = $props();

  function statusLabel(status: MonthStatus): string {
    if (status === 'open') return 'Aberto';
    if (status === 'grace') return 'Graça';
    return 'Fechado';
  }
</script>

<header class="head">
  <div class="title">
    <h1>{month.key}</h1>
    <span class="badge" data-status={month.status}>{statusLabel(month.status)}</span>
  </div>
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
    gap: var(--space-3);
  }
  .title {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  h1 {
    margin: 0;
    font-size: var(--space-6);
  }
  .badge {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    background: var(--bg-glass);
    color: var(--text-secondary);
  }
  .badge[data-status='grace'] {
    color: var(--warning);
  }
  .badge[data-status='closed'] {
    color: var(--text-muted);
  }
  .banner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    border: 1px solid var(--warning);
    border-radius: var(--radius-md);
    background: rgba(251, 191, 36, 0.08);
    color: var(--warning);
  }
  .primary {
    background: var(--accent-gradient);
    color: white;
    border: none;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    cursor: pointer;
    min-height: 36px;
    font: inherit;
  }
</style>
