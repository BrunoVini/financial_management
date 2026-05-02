<script lang="ts">
  import Card from '@/components/Card.svelte';
  import { t } from '@/i18n';
  import { formatMoney } from '@/lib/money';
  import { appStore, settings, categories } from '@/lib/appStore';
  import { categorySpendVsBudget } from '@/lib/db/budgets';
  import { monthKey as toMonthKey } from '@/lib/db/months';

  let key = $derived(toMonthKey(new Date()));

  let top = $derived.by(() => {
    const rows = categorySpendVsBudget(
      $appStore,
      key,
      $settings.displayCurrency,
      $appStore.ratesCache?.rates ?? {},
    ).filter((r) => r.limit !== undefined);
    rows.sort((a, b) => (b.pctUsed ?? 0) - (a.pctUsed ?? 0));
    return rows.slice(0, 3);
  });

  function name(id: string) {
    return $categories.expense.find((c) => c.id === id)?.name ?? '—';
  }

  function color(id: string) {
    return $categories.expense.find((c) => c.id === id)?.color ?? '#888';
  }

  function progressColor(pct: number): string {
    if (pct > 100) return 'var(--negative)';
    if (pct >= 80) return 'var(--warning)';
    return 'var(--positive)';
  }
</script>

{#if top.length > 0}
  <Card title={$t('budget.summary.label')}>
    <ul>
      {#each top as row (row.categoryId)}
        {@const pct = row.pctUsed ?? 0}
        {@const limit = row.limit ?? 0}
        <li>
          <span class="dot" style="background: {color(row.categoryId)}"></span>
          <div class="text">
            <span class="name">{name(row.categoryId)}</span>
            <span class="meta">
              {formatMoney(row.spent, $settings.displayCurrency, $settings.language)} /
              {formatMoney(limit, $settings.displayCurrency, $settings.language)}
            </span>
          </div>
          <div class="track">
            <div
              class="fill"
              style="width: {Math.min(100, pct)}%; background: {progressColor(pct)}"
            ></div>
          </div>
          <span class="pct">{pct.toFixed(0)}%</span>
        </li>
      {/each}
    </ul>
  </Card>
{/if}

<style>
  ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-2); }
  li {
    display: grid; grid-template-columns: auto 1fr 120px auto; gap: var(--space-3); align-items: center;
    padding: var(--space-2) var(--space-3); background: var(--bg-glass);
    border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .text { display: flex; flex-direction: column; min-width: 0; }
  .name { color: var(--text-primary); }
  .meta { color: var(--text-secondary); font-size: 0.78rem; font-variant-numeric: tabular-nums; }
  .track { height: 6px; background: var(--bg-raised); border-radius: var(--radius-pill); overflow: hidden; }
  .fill { height: 100%; transition: width var(--motion-base) ease, background var(--motion-base) ease; }
  .pct { color: var(--text-secondary); font-size: 0.82rem; font-variant-numeric: tabular-nums; }
  @media (max-width: 600px) {
    li { grid-template-columns: auto 1fr auto; }
    .track { grid-column: 1 / -1; }
  }
</style>
