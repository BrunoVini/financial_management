<script lang="ts">
  import Card from '@/components/Card.svelte';
  import { t } from '@/i18n';
  import { formatMoney } from '@/lib/money';
  import { appStore, settings, categories } from '@/lib/appStore';
  import { categorySpendVsBudget } from '@/lib/db/budgets';
  import type { MonthKey } from '@/lib/types';

  interface Props {
    monthKey: MonthKey;
  }

  let { monthKey }: Props = $props();

  let rows = $derived(
    categorySpendVsBudget(
      $appStore,
      monthKey,
      $settings.displayCurrency,
      $appStore.ratesCache?.rates ?? {},
    ).filter((r) => r.limit !== undefined),
  );

  function categoryName(id: string): string {
    return $categories.expense.find((c) => c.id === id)?.name ?? '—';
  }

  function categoryColor(id: string): string {
    return $categories.expense.find((c) => c.id === id)?.color ?? '#888';
  }

  function progressColor(pct: number): string {
    if (pct > 100) return 'var(--negative)';
    if (pct >= 80) return 'var(--warning)';
    return 'var(--positive)';
  }

  function formatProgress(used: number, limit: number, pct: number): string {
    return $t('budget.progress')
      .replace('{used}', formatMoney(used, $settings.displayCurrency, $settings.language))
      .replace('{limit}', formatMoney(limit, $settings.displayCurrency, $settings.language))
      .replace('{pct}', pct.toFixed(0));
  }
</script>

{#if rows.length > 0}
  <Card title={$t('settings.section.budgets')}>
    <ul>
      {#each rows as row (row.categoryId)}
        {@const pct = row.pctUsed ?? 0}
        {@const limit = row.limit ?? 0}
        <li>
          <header>
            <span class="dot" style="background: {categoryColor(row.categoryId)}"></span>
            <span class="name">{categoryName(row.categoryId)}</span>
            <span class="meta">{formatProgress(row.spent, limit, pct)}</span>
          </header>
          <div class="track">
            <div
              class="fill"
              style="width: {Math.min(100, pct)}%; background: {progressColor(pct)}"
            ></div>
          </div>
          {#if pct > 100}
            <p class="warn">{$t('budget.over')}</p>
          {/if}
        </li>
      {/each}
    </ul>
  </Card>
{/if}

<style>
  ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-3); }
  header { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: var(--space-2); }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .name { color: var(--text-primary); font-weight: 500; }
  .meta { color: var(--text-secondary); font-size: 0.82rem; font-variant-numeric: tabular-nums; }
  .track {
    height: 8px; background: var(--bg-glass); border-radius: var(--radius-pill);
    overflow: hidden; margin-top: var(--space-1); border: 1px solid var(--border-subtle);
  }
  .fill { height: 100%; transition: width var(--motion-base) ease, background var(--motion-base) ease; }
  .warn { margin: var(--space-1) 0 0; color: var(--negative); font-size: 0.78rem; }
</style>
