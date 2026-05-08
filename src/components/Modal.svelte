<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import { X } from 'lucide-svelte';

  interface Props {
    open: boolean;
    title: string;
    onclose: () => void;
    children?: Snippet;
    footer?: Snippet;
    width?: 'sm' | 'md' | 'lg';
  }

  let { open, title, onclose, children, footer, width = 'md' }: Props = $props();

  let dialog: HTMLDivElement | null = $state(null);
  let lastFocused: HTMLElement | null = null;

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onclose();
    }
    if (e.key === 'Tab' && dialog) {
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  }

  onMount(() => {
    if (open) trapFocus();
  });

  $effect(() => {
    if (open) {
      lastFocused = document.activeElement as HTMLElement | null;
      queueMicrotask(trapFocus);
    } else if (lastFocused) {
      lastFocused.focus();
      lastFocused = null;
    }
  });

  function trapFocus() {
    if (!dialog) return;
    const target =
      dialog.querySelector<HTMLElement>('[autofocus]') ??
      dialog.querySelector<HTMLElement>('input, button, textarea, select') ??
      dialog;
    target.focus();
  }
</script>

{#if open}
  <div
    class="backdrop"
    role="presentation"
    onclick={onclose}
    onkeydown={handleKey}
  >
    <div
      bind:this={dialog}
      class="dialog"
      data-width={width}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={handleKey}
    >
      <header>
        <h2>{title}</h2>
        <button type="button" class="close" aria-label="Close" onclick={onclose}>
          <X size={18} />
        </button>
      </header>
      <div class="body">
        {#if children}{@render children()}{/if}
      </div>
      {#if footer}
        <footer>{@render footer()}</footer>
      {/if}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    /* Warm sepia overlay instead of pure black — matches the Pastoral
       coffee/cream world without the harsh #000/55 vignette. */
    background: rgba(46, 42, 38, 0.5);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-3);
    z-index: 50;
    animation: fade var(--motion-base) ease-out;
  }
  .dialog {
    background: var(--bg-raised);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xxl);
    box-shadow: 0 18px 48px rgba(46, 42, 38, 0.18);
    width: 100%;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - var(--space-6));
    animation: rise var(--motion-base) ease-out;
  }
  .dialog[data-width='sm'] { max-width: 420px; }
  .dialog[data-width='md'] { max-width: 580px; }
  .dialog[data-width='lg'] { max-width: 740px; }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-5) var(--space-5) var(--space-4);
    border-bottom: 1px solid var(--border-subtle);
  }
  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 1.4rem;
    letter-spacing: -0.015em;
    color: var(--text-primary);
  }
  .close {
    background: transparent;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-pill);
    color: var(--text-muted);
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: color var(--motion-fast), border-color var(--motion-fast);
  }
  .close:hover {
    color: var(--text-primary);
    border-color: var(--text-muted);
  }
  .body {
    padding: var(--space-5);
    overflow-y: auto;
  }
  footer {
    padding: var(--space-4) var(--space-5);
    border-top: 1px solid var(--border-subtle);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
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
