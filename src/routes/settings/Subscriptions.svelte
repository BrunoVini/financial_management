<script lang="ts">
  import { t } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import MoneyInput from '@/components/MoneyInput.svelte';
  import { mutate, settings, accounts, categories, appStore } from '@/lib/appStore';
  import {
    addSubscription,
    pauseSubscription,
    removeSubscription,
  } from '@/lib/db/recurring';
  import { formatMoney } from '@/lib/money';
  import { Pause, Play, Trash2, Plus } from 'lucide-svelte';
  import type { Currency } from '@/lib/types';

  let description = $state('');
  let amount = $state(0);
  let currency = $state<Currency>($settings.displayCurrency);
  let categoryId = $state('');
  let accountId = $state('');
  let dayOfMonth = $state(1);

  $effect(() => {
    if (!categoryId) categoryId = $categories.expense.find((c) => !c.archived)?.id ?? '';
    const match = $accounts.find((a) => a.currency === currency);
    if (!accountId || !match || $accounts.find((a) => a.id === accountId)?.currency !== currency) {
      accountId = match?.id ?? '';
    }
  });

  function add() {
    if (!description.trim() || amount <= 0 || !categoryId || !accountId) return;
    mutate(
      (s) =>
        addSubscription(s, {
          description: description.trim(),
          amount,
          currency,
          categoryId,
          accountId,
          dayOfMonth,
        }).store,
    );
    description = '';
    amount = 0;
    dayOfMonth = 1;
  }

  function categoryName(id: string): string {
    return $categories.expense.find((c) => c.id === id)?.name ?? '—';
  }
</script>

<Card title={$t('settings.section.subscriptions')}>
  <form class="add" onsubmit={(e) => { e.preventDefault(); add(); }}>
    <input
      type="text"
      placeholder={$t('subs.description')}
      bind:value={description}
    />
    <MoneyInput
      bind:value={amount}
      bind:currency
      currencies={$settings.activeCurrencies}
    />
    <select bind:value={categoryId}>
      {#each $categories.expense.filter((c) => !c.archived) as cat (cat.id)}
        <option value={cat.id}>{cat.name}</option>
      {/each}
    </select>
    <select bind:value={accountId}>
      {#each $accounts.filter((a) => a.currency === currency) as acc (acc.id)}
        <option value={acc.id}>{acc.name}</option>
      {/each}
    </select>
    <input
      type="number"
      min="1"
      max="31"
      inputmode="numeric"
      placeholder={$t('subs.day')}
      bind:value={dayOfMonth}
    />
    <button type="submit" class="primary">
      <Plus size={16} /> {$t('subs.add')}
    </button>
  </form>

  {#if $appStore.subscriptions.length === 0}
    <p class="empty">{$t('subs.empty')}</p>
  {:else}
    <ul>
      {#each $appStore.subscriptions as sub (sub.id)}
        <li class:paused={!sub.active}>
          <div class="info">
            <strong>{sub.description}</strong>
            <span class="meta">
              {formatMoney(sub.amount, sub.currency, $settings.language)} ·
              {$t('subs.day')} {sub.dayOfMonth} · {categoryName(sub.categoryId)}
            </span>
            {#if !sub.active}<span class="badge">{$t('subs.paused')}</span>{/if}
          </div>
          <div class="actions">
            <button
              type="button"
              aria-label={sub.active ? $t('subs.pause') : $t('subs.resume')}
              onclick={() => mutate((s) => pauseSubscription(s, sub.id, sub.active))}
            >
              {#if sub.active}<Pause size={14} />{:else}<Play size={14} />{/if}
            </button>
            <button
              type="button"
              class="danger"
              aria-label={$t('subs.delete')}
              onclick={() => mutate((s) => removeSubscription(s, sub.id))}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</Card>

<style>
  .add { display: grid; grid-template-columns: 1.4fr 1.6fr 1fr 1fr 0.6fr auto; gap: var(--space-2); margin-bottom: var(--space-4); }
  @media (max-width: 720px) { .add { grid-template-columns: 1fr 1fr; } .add button { grid-column: 1 / -1; } }
  input[type='text'], input[type='number'], select {
    background: var(--bg-glass); color: var(--text-primary); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md); padding: var(--space-2) var(--space-3); font: inherit; min-height: 36px; min-width: 0;
  }
  .primary {
    background: var(--accent-gradient); color: white; border: none; padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md); cursor: pointer; display: inline-flex; align-items: center; gap: var(--space-2); min-height: 36px; font: inherit;
  }
  .empty { color: var(--text-muted); margin: 0; }
  ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-2); }
  li {
    display: flex; justify-content: space-between; align-items: center; gap: var(--space-3);
    padding: var(--space-2) var(--space-3); background: var(--bg-glass);
    border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  }
  li.paused { opacity: 0.55; }
  .info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .meta { color: var(--text-secondary); font-size: 0.82rem; }
  .badge {
    background: var(--bg-raised); color: var(--text-muted); border-radius: var(--radius-pill);
    padding: 0 8px; font-size: 0.7rem; margin-top: 2px; align-self: flex-start;
  }
  .actions { display: flex; gap: var(--space-1); }
  .actions button {
    background: transparent; color: var(--text-secondary); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md); padding: var(--space-2); width: 36px; height: 36px;
    display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
  }
  .actions button.danger:hover { color: var(--negative); border-color: var(--negative); }
</style>
