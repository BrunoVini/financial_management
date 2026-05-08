<script lang="ts">
  import { onMount } from 'svelte';
  import { ChevronDown } from 'lucide-svelte';
  import type { Currency } from '@/lib/types';
  import { DEFAULT_CURRENCY_OPTIONS, type CurrencyOption } from './currencyOptions';

  interface Props {
    value: Currency;
    onchange: (next: Currency) => void;
    options?: CurrencyOption[];
    ariaLabel?: string;
  }

  let { value, onchange, options = DEFAULT_CURRENCY_OPTIONS, ariaLabel }: Props = $props();

  let open = $state(false);
  let trigger: HTMLButtonElement | null = $state(null);
  let panel: HTMLDivElement | null = $state(null);

  let current = $derived(options.find((o) => o.code === value) ?? options[0]);

  function toggle() {
    open = !open;
  }

  function pick(opt: CurrencyOption) {
    open = false;
    if (opt.code !== value) onchange(opt.code);
    trigger?.focus();
  }

  function onDocClick(e: MouseEvent) {
    if (!open) return;
    const target = e.target as Node;
    if (panel?.contains(target) || trigger?.contains(target)) return;
    open = false;
  }

  function onKey(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'Escape') {
      open = false;
      trigger?.focus();
      e.preventDefault();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLButtonElement>('[role="option"]'));
    if (items.length === 0) return;
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
    e.preventDefault();
  }

  onMount(() => {
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  });
</script>

<div class="wrap">
  <button
    type="button"
    class="trigger"
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-label={ariaLabel}
    bind:this={trigger}
    onclick={toggle}
  >
    <span class="flag" aria-hidden="true">{current.flag}</span>
    <span class="code">{current.code}</span>
    <span class="label">· {current.label}</span>
    <ChevronDown size={16} class="chev" />
  </button>

  {#if open}
    <div class="panel" role="listbox" bind:this={panel}>
      {#each options as opt (opt.code)}
        <button
          type="button"
          role="option"
          aria-selected={opt.code === value}
          class="item"
          class:active={opt.code === value}
          onclick={() => pick(opt)}
        >
          <span class="flag" aria-hidden="true">{opt.flag}</span>
          <span class="code">{opt.code}</span>
          <span class="label">· {opt.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .wrap {
    position: relative;
    display: inline-block;
    width: 100%;
    max-width: 320px;
  }
  .trigger {
    width: 100%;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    background: var(--bg-glass);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    cursor: pointer;
    font: inherit;
    min-height: 40px;
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .trigger:hover {
    border-color: var(--text-muted);
  }
  .trigger[aria-expanded='true'] {
    border-color: transparent;
    background: linear-gradient(var(--bg-raised), var(--bg-raised)) padding-box,
      var(--accent-gradient) border-box;
    border: 1px solid transparent;
  }
  .flag {
    font-size: 1.2em;
    line-height: 1;
  }
  .code {
    font-weight: 600;
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
  }
  .label {
    flex: 1;
    text-align: left;
    color: var(--text-muted);
  }
  .panel {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: var(--bg-raised);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-popover, 0 12px 32px rgba(0, 0, 0, 0.35));
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    z-index: 50;
    animation: fade 0.12s ease;
  }
  @keyframes fade {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .item {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    background: transparent;
    color: var(--text-primary);
    border: none;
    border-radius: var(--radius-sm, 8px);
    padding: var(--space-2) var(--space-3);
    cursor: pointer;
    font: inherit;
    text-align: left;
  }
  .item:hover,
  .item:focus-visible {
    background: var(--bg-glass);
    outline: none;
  }
  .item.active {
    background: var(--bg-glass);
  }
  .item.active .code {
    color: var(--text-primary);
  }
  @media (prefers-reduced-motion: reduce) {
    .panel {
      animation: none;
    }
  }
</style>
