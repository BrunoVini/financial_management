<script lang="ts">
  import { t } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import { mutate, settings, categories, appStore } from '@/lib/appStore';
  import { setBudget } from '@/lib/db/budgets';

  function handleChange(categoryId: string, value: string) {
    const cleaned = value
      .replace(/\s/g, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '')
      .replace(',', '.');
    const n = Number(cleaned);
    mutate((s) => setBudget(s, categoryId, Number.isFinite(n) ? n : 0));
  }
</script>

<Card title={$t('settings.section.budgets')}>
  <p class="hint">{$t('budget.empty')}</p>
  <ul>
    {#each $categories.expense.filter((c) => !c.archived) as cat (cat.id)}
      {@const current = $appStore.budgets[cat.id] ?? 0}
      <li>
        <span class="dot" style="background: {cat.color}"></span>
        <span class="name">{cat.name}</span>
        <div class="input-wrap">
          <input
            type="text"
            inputmode="decimal"
            placeholder="0,00"
            value={current === 0 ? '' : String(current)}
            oninput={(e) => handleChange(cat.id, (e.target as HTMLInputElement).value)}
          />
          <span class="currency">{$settings.displayCurrency}</span>
        </div>
      </li>
    {/each}
  </ul>
</Card>

<style>
  .hint { margin: 0 0 var(--space-3); color: var(--text-muted); font-size: 0.86rem; }
  ul {
    list-style: none; padding: 0; margin: 0;
    display: flex; flex-direction: column; gap: var(--space-2);
  }
  li {
    display: grid; grid-template-columns: auto 1fr 180px; gap: var(--space-3);
    align-items: center; padding: var(--space-2) var(--space-3);
    background: var(--bg-glass); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .name { color: var(--text-primary); }
  .input-wrap {
    display: flex; align-items: center; gap: var(--space-2);
    background: var(--bg-raised); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md); padding: 0 var(--space-3);
  }
  input {
    flex: 1; min-width: 0; background: transparent; border: none;
    color: var(--text-primary); padding: var(--space-2) 0; font: inherit;
    min-height: 36px; text-align: right;
  }
  .currency { color: var(--text-secondary); font-size: 0.78rem; }
</style>
