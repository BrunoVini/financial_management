<script lang="ts">
  import { t } from '@/i18n';
  import { categories } from '@/lib/appStore';
  import { Search } from 'lucide-svelte';

  interface Props {
    query: string;
    categoryId: string;
  }

  let { query = $bindable(), categoryId = $bindable() }: Props = $props();
</script>

<div class="row">
  <label class="search">
    <Search size={16} />
    <input
      type="text"
      placeholder={$t('monthDetail.search.placeholder')}
      bind:value={query}
    />
  </label>
  <select bind:value={categoryId} aria-label={$t('tx.category')}>
    <option value="">{$t('monthDetail.search.allCategories')}</option>
    {#each $categories.expense.filter((c) => !c.archived) as cat (cat.id)}
      <option value={cat.id}>{cat.name}</option>
    {/each}
  </select>
</div>

<style>
  .row {
    display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-3);
  }
  .search {
    flex: 1; min-width: 220px; display: flex; align-items: center; gap: var(--space-2);
    background: var(--bg-glass); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md); padding: 0 var(--space-3); color: var(--text-secondary);
  }
  input {
    flex: 1; min-width: 0; background: transparent; border: none; color: var(--text-primary);
    padding: var(--space-2) 0; min-height: 36px; font: inherit; outline: none;
  }
  select {
    background: var(--bg-glass); color: var(--text-primary); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md); padding: var(--space-2) var(--space-3); font: inherit; min-height: 36px;
  }
</style>
