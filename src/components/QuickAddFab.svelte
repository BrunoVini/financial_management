<script lang="ts">
  import {
    Plus,
    ArrowDownCircle,
    ArrowUpCircle,
    ArrowLeftRight,
    Wallet,
    CreditCard,
  } from 'lucide-svelte';
  import { t } from '@/i18n';
  import { openTransactionModal } from '@/lib/uiStore';
  import { settings } from '@/lib/appStore';

  let open = $state(false);

  function pick(kind: 'expense' | 'income' | 'fx' | 'salary' | 'installment') {
    open = false;
    openTransactionModal(kind);
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false;
  }
</script>

<svelte:window onkeydown={handleKey} />

<div class="fab-wrap">
  {#if open}
    <button
      type="button"
      class="scrim"
      aria-label="Close menu"
      onclick={() => (open = false)}
    ></button>
    <div class="menu" role="menu">
      <button type="button" role="menuitem" onclick={() => pick('expense')}>
        <ArrowDownCircle size={18} />
        <span>{$t('tx.fab.expense')}</span>
      </button>
      <button type="button" role="menuitem" onclick={() => pick('income')}>
        <ArrowUpCircle size={18} />
        <span>{$t('tx.fab.income')}</span>
      </button>
      <button type="button" role="menuitem" onclick={() => pick('fx')}>
        <ArrowLeftRight size={18} />
        <span>{$t('tx.fab.fx')}</span>
      </button>
      <button type="button" role="menuitem" onclick={() => pick('installment')}>
        <CreditCard size={18} />
        <span>{$t('tx.fab.installment')}</span>
      </button>
      {#if $settings.salaryAmount > 0}
        <button type="button" role="menuitem" onclick={() => pick('salary')}>
          <Wallet size={18} />
          <span>{$t('tx.fab.salary')}</span>
        </button>
      {/if}
    </div>
  {/if}

  <button
    type="button"
    class="fab"
    class:open
    aria-label={$t('tx.fab.label')}
    aria-expanded={open}
    aria-haspopup="menu"
    onclick={() => (open = !open)}
  >
    <Plus size={24} />
  </button>
</div>

<style>
  .fab-wrap {
    position: fixed;
    bottom: 96px;
    right: var(--space-4);
    z-index: 30;
  }
  @media (min-width: 769px) {
    .fab-wrap {
      bottom: var(--space-5);
    }
  }
  .scrim {
    position: fixed;
    inset: 0;
    background: rgba(46, 42, 38, 0.45);
    backdrop-filter: blur(2px);
    border: none;
    cursor: default;
    animation: fade var(--motion-base) ease-out;
  }
  .menu {
    position: absolute;
    bottom: 70px;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 200px;
    animation: rise var(--motion-base) ease-out;
  }
  .menu button {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 12px var(--space-4);
    background: var(--bg-raised);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-pill);
    box-shadow: 0 6px 18px rgba(46, 42, 38, 0.14);
    cursor: pointer;
    font: inherit;
    font-weight: 500;
    text-align: left;
    min-height: 44px;
    transition: border-color var(--motion-fast), color var(--motion-fast);
  }
  .menu button:hover {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
  }
  .fab {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--accent-gradient);
    color: white;
    border: none;
    box-shadow: 0 8px 22px rgba(124, 148, 116, 0.32), 0 4px 14px rgba(46, 42, 38, 0.12);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform var(--motion-base) ease, box-shadow var(--motion-base) ease;
  }
  .fab:hover {
    box-shadow: 0 12px 28px rgba(124, 148, 116, 0.38), 0 4px 14px rgba(46, 42, 38, 0.16);
  }
  .fab.open {
    transform: rotate(45deg);
  }
  @keyframes fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
