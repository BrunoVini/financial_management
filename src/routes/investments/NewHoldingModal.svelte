<script lang="ts">
  import { t } from '@/i18n';
  import Modal from '@/components/Modal.svelte';
  import CurrencyPicker from '@/components/CurrencyPicker.svelte';
  import { mutate, settings, categories } from '@/lib/appStore';
  import { addHolding } from '@/lib/db/investments';
  import type { Currency, YieldType } from '@/lib/types';

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  type Kind = 'manual' | 'fixed' | 'crypto' | 'stock';

  let kind = $state<Kind>('manual');
  let name = $state('');
  let type = $state('');
  let currency = $state<Currency>($settings.displayCurrency);
  let coinAmount = $state(0);
  let ticker = $state('');
  let shareAmount = $state(0);
  let yieldType = $state<YieldType>('fixed');
  let yieldRatePct = $state(12);
  let error = $state<string | null>(null);

  $effect(() => {
    if (open) {
      kind = 'manual';
      name = '';
      const firstType = $categories.investment.find((c) => !c.archived);
      type = firstType?.name ?? '';
      currency = $settings.displayCurrency;
      coinAmount = 0;
      ticker = '';
      shareAmount = 0;
      yieldType = 'fixed';
      yieldRatePct = 12;
      error = null;
    }
  });

  function submit(e: Event) {
    e.preventDefault();
    error = null;
    if (!name.trim()) { error = $t('inv.new.error.name'); return; }
    if (kind === 'crypto' && coinAmount < 0) { error = $t('inv.new.error.amount'); return; }
    if (kind === 'stock') {
      if (!ticker.trim()) { error = $t('inv.new.error.ticker'); return; }
      if (shareAmount < 0) { error = $t('inv.new.error.shares'); return; }
    }
    if (kind === 'fixed' && (!Number.isFinite(yieldRatePct) || yieldRatePct < 0)) {
      error = $t('inv.new.error.yieldRate'); return;
    }

    const extras =
      kind === 'crypto'
        ? { coinId: 'bitcoin', coinAmount }
        : kind === 'stock'
          ? { ticker: ticker.trim().toUpperCase(), shareAmount }
          : kind === 'fixed'
            ? { yieldType, yieldRate: yieldRatePct / 100 }
            : {};
    mutate((s) =>
      addHolding(s, {
        name: name.trim(),
        type: type.trim() || (kind === 'crypto' ? 'Cripto' : kind === 'stock' ? 'Ações' : 'Renda Fixa'),
        currency,
        ...extras,
      }),
    );
    onclose();
  }
</script>

<Modal {open} title={$t('inv.new.title')} {onclose}>
  <form id="new-holding-form" onsubmit={submit}>
    <label>
      <span>{$t('inv.kind.label')}</span>
      <select bind:value={kind}>
        <option value="manual">{$t('inv.kind.manual')}</option>
        <option value="fixed">{$t('inv.kind.fixed')}</option>
        <option value="crypto">{$t('inv.kind.crypto')}</option>
        <option value="stock">{$t('inv.kind.stock')}</option>
      </select>
    </label>

    <label>
      <span>{$t('inv.new.name')}</span>
      <input type="text" bind:value={name} autocomplete="off" />
    </label>

    {#if kind === 'manual'}
      <label>
        <span>{$t('inv.new.type')}</span>
        <input type="text" bind:value={type} autocomplete="off" />
      </label>
    {:else if kind === 'crypto'}
      <label>
        <span>{$t('inv.new.coinAmount')}</span>
        <input type="number" inputmode="decimal" step="0.00000001" min="0" bind:value={coinAmount} />
      </label>
    {:else if kind === 'stock'}
      <label>
        <span>{$t('inv.new.ticker')}</span>
        <input type="text" bind:value={ticker} autocomplete="off" placeholder="PETR4" />
      </label>
      <label>
        <span>{$t('inv.new.shareAmount')}</span>
        <input type="number" inputmode="decimal" step="1" min="0" bind:value={shareAmount} />
      </label>
    {:else if kind === 'fixed'}
      <label>
        <span>{$t('inv.new.yieldType')}</span>
        <select bind:value={yieldType}>
          <option value="fixed">{$t('inv.new.yieldType.fixed')}</option>
          <option value="cdi">{$t('inv.new.yieldType.cdi')}</option>
        </select>
      </label>
      <label>
        <span>{yieldType === 'fixed' ? $t('inv.new.yieldRate.fixed') : $t('inv.new.yieldRate.cdi')}</span>
        <input type="number" inputmode="decimal" step="0.01" min="0" bind:value={yieldRatePct} />
      </label>
    {/if}

    <label>
      <span>{$t('inv.new.currency')}</span>
      <CurrencyPicker bind:value={currency} options={$settings.activeCurrencies} />
    </label>

    {#if error}<p class="error" role="alert">{error}</p>{/if}
  </form>

  {#snippet footer()}
    <button type="button" onclick={onclose}>{$t('common.cancel')}</button>
    <button type="submit" form="new-holding-form" class="primary">{$t('inv.new.create')}</button>
  {/snippet}
</Modal>

<style>
  form { display: flex; flex-direction: column; gap: var(--space-3); }
  label { display: flex; flex-direction: column; gap: 6px; font-family: var(--font-display); font-style: italic; color: var(--text-muted); font-size: 0.92rem; }
  input[type='text'], input[type='number'], select {
    background: var(--bg-glass); color: var(--text-primary);
    border: 1px solid var(--border-subtle); border-radius: var(--radius-lg);
    padding: var(--space-2) var(--space-3); font: inherit; min-height: 40px;
  }
  .error { color: var(--negative); margin: 0; font-size: 0.86rem; }
  button {
    padding: 10px var(--space-5); background: transparent; color: var(--text-secondary);
    border: 1px solid var(--border-subtle); border-radius: var(--radius-pill); cursor: pointer;
    font: inherit; font-weight: 600; min-height: 40px;
    transition: border-color var(--motion-fast), color var(--motion-fast);
  }
  button:hover { border-color: var(--text-muted); color: var(--text-primary); }
  button.primary { background: var(--accent-gradient); color: #fff; border-color: transparent; box-shadow: 0 4px 14px rgba(124, 148, 116, 0.22); }
  button.primary:hover { color: #fff; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(124, 148, 116, 0.3); }
</style>
