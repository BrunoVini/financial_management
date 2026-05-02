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
    display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-3);
  }
  button {
    padding: var(--space-2) var(--space-4); background: var(--bg-raised);
    color: var(--text-secondary); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-pill); cursor: pointer; font: inherit;
  }
  button.active { background: var(--accent-gradient); color: white; border-color: transparent; }
</style>
