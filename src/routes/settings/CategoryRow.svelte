<script lang="ts">
  import { t } from '@/i18n';
  import { Trash2, Archive, ArchiveRestore } from 'lucide-svelte';
  import { CATEGORY_PALETTE } from './categoryPalette';
  import type { Category } from '@/lib/types';

  interface Props {
    cat: Category;
    onRename: (value: string) => void;
    onRecolor: (color: string) => void;
    onToggleArchive: () => void;
    onDelete: () => void;
  }

  let { cat, onRename, onRecolor, onToggleArchive, onDelete }: Props = $props();
</script>

<li class:archived={cat.archived}>
  <div class="row">
    <input
      class="name"
      type="text"
      value={cat.name}
      oninput={(e) => onRename((e.target as HTMLInputElement).value)}
    />
    <div class="colors" aria-label="color">
      {#each CATEGORY_PALETTE as c (c)}
        <button
          type="button"
          class="swatch"
          style="background:{c}"
          aria-label={c}
          aria-pressed={cat.color === c}
          class:selected={cat.color === c}
          onclick={() => onRecolor(c)}
        ></button>
      {/each}
    </div>
    <div class="actions">
      <button
        type="button"
        aria-label={cat.archived
          ? $t('settings.categories.unarchive')
          : $t('settings.categories.archive')}
        onclick={onToggleArchive}
      >
        {#if cat.archived}<ArchiveRestore size={16} />{:else}<Archive size={16} />{/if}
      </button>
      <button
        type="button"
        class="danger"
        aria-label={$t('settings.categories.delete')}
        onclick={onDelete}
      >
        <Trash2 size={16} />
      </button>
    </div>
  </div>
  {#if cat.archived}
    <span class="badge">{$t('settings.categories.archived')}</span>
  {/if}
</li>

<style>
  li.archived {
    opacity: 0.55;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
  }
  .name {
    flex: 1 1 160px;
    min-width: 0;
    background: var(--bg-raised);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    min-height: 36px;
    font: inherit;
  }
  .colors {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .swatch {
    width: 16px;
    height: 16px;
    border-radius: var(--radius-pill);
    border: 2px solid transparent;
    cursor: pointer;
  }
  .swatch.selected {
    border-color: var(--text-primary);
  }
  .actions {
    display: flex;
    gap: var(--space-1);
  }
  .actions button {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2);
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .actions button.danger:hover {
    color: var(--negative);
    border-color: var(--negative);
  }
  .badge {
    font-size: 0.7rem;
    color: var(--text-muted);
    margin-left: var(--space-1);
  }
</style>
