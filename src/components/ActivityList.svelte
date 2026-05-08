<script lang="ts">
  import { t } from '@/i18n';
  import { formatMoney } from '@/lib/money';
  import type { Currency, Language } from '@/lib/types';

  export interface ActivityEntry {
    id: string;
    kind: 'expense' | 'income' | 'fx' | 'salary';
    amount: number;
    currency: Currency;
    date: string; // ISO date or datetime
    label: string;
    color?: string;
  }

  interface Props {
    entries: ActivityEntry[];
    language: Language;
    onDelete?: (entry: ActivityEntry) => void;
    emptyText?: string;
  }

  let { entries, language, onDelete, emptyText }: Props = $props();

  const KIND_COLOR: Record<ActivityEntry['kind'], string> = {
    expense: 'var(--negative)',
    income: 'var(--positive)',
    fx: 'var(--info)',
    salary: 'var(--accent-primary)',
  };

  const KIND_SIGN: Record<ActivityEntry['kind'], string> = {
    expense: '−',
    income: '+',
    fx: '⇄',
    salary: '+',
  };
</script>

{#if entries.length === 0}
  <p class="empty">{emptyText ?? $t('overview.activity.empty')}</p>
{:else}
  <ul>
    {#each entries as entry (entry.id)}
      <li>
        <span class="dot" style="background: {entry.color ?? KIND_COLOR[entry.kind]}"></span>
        <div class="text">
          <span class="label">{entry.label}</span>
          <span class="date">{entry.date.slice(0, 10)}</span>
        </div>
        <span class="amount" style="color: {KIND_COLOR[entry.kind]}">
          {KIND_SIGN[entry.kind]} {formatMoney(entry.amount, entry.currency, language)}
        </span>
        {#if onDelete}
          <button
            type="button"
            aria-label={$t('common.delete')}
            class="delete"
            onclick={() => onDelete(entry)}
          >×</button>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .empty {
    font-family: var(--font-display);
    font-style: italic;
    color: var(--text-muted);
    margin: 0;
    font-size: 0.95rem;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
  }
  li {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: var(--space-3);
    align-items: center;
    padding: 14px var(--space-2);
    border-bottom: 1px solid var(--border-subtle);
    border-radius: 0;
    background: transparent;
  }
  li:last-child { border-bottom: none; }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-left: 4px;
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .label {
    color: var(--text-primary);
    font-weight: 600;
    font-size: 0.95rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .date {
    font-family: var(--font-display);
    font-style: italic;
    color: var(--text-muted);
    font-size: 0.82rem;
  }
  .amount {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 1.05rem;
    letter-spacing: -0.01em;
    font-variant-numeric: tabular-nums;
  }
  .delete {
    background: transparent;
    color: var(--text-muted);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-pill);
    width: 28px;
    height: 28px;
    cursor: pointer;
    line-height: 1;
    font-size: 1rem;
    transition: color var(--motion-fast), border-color var(--motion-fast);
  }
  .delete:hover {
    color: var(--negative);
    border-color: var(--negative);
  }
</style>
