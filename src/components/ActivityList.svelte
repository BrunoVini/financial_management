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
    color: var(--text-muted);
    margin: 0;
    font-size: 0.9rem;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  li {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: var(--space-3);
    align-items: center;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    background: var(--bg-glass);
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .label {
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .date {
    color: var(--text-muted);
    font-size: 0.78rem;
  }
  .amount {
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }
  .delete {
    background: transparent;
    color: var(--text-muted);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    width: 28px;
    height: 28px;
    cursor: pointer;
    line-height: 1;
    font-size: 1rem;
  }
  .delete:hover {
    color: var(--negative);
    border-color: var(--negative);
  }
</style>
