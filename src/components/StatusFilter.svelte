<script lang="ts">
  import type { MonthStatus } from '@/lib/types';
  import { t } from '@/i18n';

  type Filter = MonthStatus | 'all';

  interface Props {
    value: Filter;
  }

  let { value = $bindable() }: Props = $props();

  const ITEMS: { id: Filter; key: string }[] = [
    { id: 'all', key: 'months.filter.all' },
    { id: 'open', key: 'months.filter.open' },
    { id: 'grace', key: 'months.filter.grace' },
    { id: 'closed', key: 'months.filter.closed' },
  ];
</script>

<div class="pills" role="tablist">
  {#each ITEMS as item (item.id)}
    <button
      type="button"
      role="tab"
      aria-selected={value === item.id}
      class:active={value === item.id}
      onclick={() => (value = item.id)}
    >
      {$t(item.key)}
    </button>
  {/each}
</div>

<style>
  .pills {
    display: flex; gap: var(--space-2); flex-wrap: wrap;
  }
  button {
    padding: 8px var(--space-4); background: var(--bg-glass);
    color: var(--text-secondary); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-pill); cursor: pointer; font: inherit;
    font-weight: 500;
    transition: border-color var(--motion-fast), background var(--motion-fast), color var(--motion-fast);
  }
  button:hover { border-color: var(--text-muted); color: var(--text-primary); }
  button.active {
    background: var(--accent-gradient); color: white; border-color: transparent;
    box-shadow: 0 4px 14px rgba(124, 148, 116, 0.22);
  }
</style>
