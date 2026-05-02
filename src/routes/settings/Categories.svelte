<script lang="ts">
  import { t } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import { mutate, categories } from '@/lib/appStore';
  import {
    addCategory,
    archiveCategory,
    unarchiveCategory,
    removeCategory,
    updateCategory,
    type CategoryKind,
  } from '@/lib/db/categories';
  import { CATEGORY_PALETTE } from './categoryPalette';
  import CategoryRow from './CategoryRow.svelte';

  let activeKind: CategoryKind = $state('expense');
  let newName = $state('');
  let newColor = $state(CATEGORY_PALETTE[0]);

  function add() {
    const name = newName.trim();
    if (!name) return;
    mutate((s) => addCategory(s, activeKind, { name, color: newColor }));
    newName = '';
  }
</script>

<Card title={$t('settings.section.categories')}>
  <div class="tabs" role="tablist">
    {#each ['expense', 'investment'] as const as kind (kind)}
      <button
        type="button"
        role="tab"
        aria-selected={activeKind === kind}
        class:active={activeKind === kind}
        onclick={() => (activeKind = kind)}
      >
        {$t(`settings.categories.${kind}`)}
      </button>
    {/each}
  </div>

  <form class="add" onsubmit={(e) => { e.preventDefault(); add(); }}>
    <input
      type="text"
      placeholder={$t('settings.categories.placeholder')}
      bind:value={newName}
    />
    <div class="palette" role="group" aria-label="color">
      {#each CATEGORY_PALETTE as c (c)}
        <button
          type="button"
          class="swatch"
          style="background:{c}"
          aria-label={c}
          aria-pressed={newColor === c}
          class:selected={newColor === c}
          onclick={() => (newColor = c)}
        ></button>
      {/each}
    </div>
    <button type="submit" class="primary">{$t('settings.categories.add')}</button>
  </form>

  <ul class="list">
    {#each $categories[activeKind] as cat (cat.id)}
      <CategoryRow
        {cat}
        onRename={(v) => mutate((s) => updateCategory(s, activeKind, cat.id, { name: v }))}
        onRecolor={(c) => mutate((s) => updateCategory(s, activeKind, cat.id, { color: c }))}
        onToggleArchive={() =>
          mutate((s) =>
            cat.archived
              ? unarchiveCategory(s, activeKind, cat.id)
              : archiveCategory(s, activeKind, cat.id),
          )}
        onDelete={() => mutate((s) => removeCategory(s, activeKind, cat.id))}
      />
    {/each}
  </ul>
</Card>

<style>
  .tabs {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }
  .tabs button {
    padding: var(--space-2) var(--space-4);
    background: var(--bg-raised);
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-pill);
    cursor: pointer;
    font: inherit;
  }
  .tabs button.active {
    background: var(--accent-gradient);
    color: white;
    border-color: transparent;
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    margin-bottom: var(--space-4);
  }
  .add input {
    flex: 1;
    min-width: 180px;
    background: var(--bg-raised);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    min-height: 36px;
    font: inherit;
  }
  .palette {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .swatch {
    width: 22px;
    height: 22px;
    border-radius: var(--radius-pill);
    border: 2px solid transparent;
    cursor: pointer;
  }
  .swatch.selected {
    border-color: var(--text-primary);
  }
  .primary {
    background: var(--accent-gradient);
    color: white;
    border: none;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    cursor: pointer;
    min-height: 36px;
  }
  .list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
</style>
