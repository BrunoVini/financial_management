<script lang="ts">
  import { t } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import MoneyInput from '@/components/MoneyInput.svelte';
  import { wizard, type WizardHolding } from './state';
  import { defaultInvestmentCategories } from '@/lib/db/categories';
  import { Trash2, Plus } from 'lucide-svelte';

  const MAX_HOLDINGS = 10;

  let typeOptions = $derived(defaultInvestmentCategories($wizard.language).map((c) => c.name));

  function add() {
    wizard.update((w) => {
      if (w.holdings.length >= MAX_HOLDINGS) return w;
      const fallbackType = defaultInvestmentCategories(w.language)[0]?.name ?? 'Other';
      const next: WizardHolding = {
        name: '',
        type: fallbackType,
        currency: w.activeCurrencies[0] ?? 'BRL',
        currentValue: 0,
      };
      return { ...w, holdings: [...w.holdings, next] };
    });
  }

  function remove(index: number) {
    wizard.update((w) => ({
      ...w,
      holdings: w.holdings.filter((_, i) => i !== index),
    }));
  }

  function patch(index: number, field: keyof WizardHolding, value: string | number) {
    wizard.update((w) => {
      const holdings = w.holdings.map((h, i) =>
        i === index ? ({ ...h, [field]: value } as WizardHolding) : h,
      );
      return { ...w, holdings };
    });
  }
</script>

<Card padding="lg">
  <header class="head">
    <h4>{$t('onboarding.holdings.title')}</h4>
    <p class="help">{$t('onboarding.holdings.help')}</p>
  </header>

  {#each $wizard.holdings as holding, i (i)}
    <div class="row">
      <input
        class="name"
        type="text"
        placeholder={$t('onboarding.holdings.name')}
        value={holding.name}
        oninput={(e) => patch(i, 'name', (e.target as HTMLInputElement).value)}
      />
      <select
        class="type"
        value={holding.type}
        onchange={(e) => patch(i, 'type', (e.target as HTMLSelectElement).value)}
      >
        {#each typeOptions as opt (opt)}
          <option value={opt}>{opt}</option>
        {/each}
      </select>
      <div class="value">
        <MoneyInput
          bind:value={$wizard.holdings[i].currentValue}
          bind:currency={$wizard.holdings[i].currency}
          currencies={$wizard.activeCurrencies}
        />
      </div>
      <button
        type="button"
        class="remove"
        aria-label={$t('onboarding.holdings.remove')}
        onclick={() => remove(i)}
      >
        <Trash2 size={16} />
      </button>
    </div>
  {/each}

  {#if $wizard.holdings.length < MAX_HOLDINGS}
    <button type="button" class="add" onclick={add}>
      <Plus size={16} />
      {$t('onboarding.holdings.add')}
    </button>
  {/if}
</Card>

<style>
  .head h4 {
    margin: 0 0 var(--space-2);
    font-size: 1rem;
    color: var(--text-primary);
  }
  .help {
    margin: 0 0 var(--space-4);
    color: var(--text-muted);
    font-size: 0.86rem;
  }
  .row {
    display: grid;
    grid-template-columns: 1.4fr 1fr 1.6fr auto;
    gap: var(--space-2);
    align-items: center;
    margin-bottom: var(--space-3);
  }
  @media (max-width: 600px) {
    .row {
      grid-template-columns: 1fr 1fr;
    }
    .value {
      grid-column: 1 / -1;
    }
  }
  .name,
  .type {
    background: var(--bg-raised);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    font: inherit;
    min-height: 44px;
    min-width: 0;
  }
  .remove {
    background: transparent;
    color: var(--text-muted);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2);
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .remove:hover {
    color: var(--negative);
    border-color: var(--negative);
  }
  .add {
    margin-top: var(--space-2);
    background: transparent;
    color: var(--accent-primary);
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
</style>
