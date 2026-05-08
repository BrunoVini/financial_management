<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    variant?: 'glass' | 'raised';
    padding?: 'sm' | 'md' | 'lg';
    children?: Snippet;
    actions?: Snippet;
  }

  let { title, variant = 'glass', padding = 'md', children, actions }: Props = $props();
</script>

<section class="card" data-variant={variant} data-padding={padding}>
  {#if title || actions}
    <header>
      {#if title}<h3>{title}</h3>{/if}
      {#if actions}<div class="actions">{@render actions()}</div>{/if}
    </header>
  {/if}
  {#if children}
    <div class="body">{@render children()}</div>
  {/if}
</section>

<style>
  .card {
    /* Pastoral: generous rounding (xxl ≈ 28px). The signature "raised
       paper" look is an inset 1px top highlight (white/cream sheen) +
       a soft warm outer shadow — added in the body of this rule rather
       than via the legacy --shadow-glass token so the inset stays
       consistent across themes. */
    border-radius: var(--radius-xxl);
    border: 1px solid var(--border-subtle);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.7) inset,
      0 4px 14px rgba(46, 42, 38, 0.05);
    transition:
      border-color var(--motion-fast),
      box-shadow var(--motion-base);
    background: var(--bg-raised);
  }
  :global([data-theme='dark']) .card {
    box-shadow:
      0 1px 0 rgba(245, 239, 230, 0.04) inset,
      0 4px 14px rgba(0, 0, 0, 0.28);
  }
  .card[data-variant='glass'] {
    background: var(--bg-glass);
  }
  .card[data-padding='sm'] {
    padding: var(--space-3);
  }
  .card[data-padding='md'] {
    padding: var(--space-5);
  }
  .card[data-padding='lg'] {
    padding: var(--space-6);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
  h3 {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 1.1rem;
    letter-spacing: -0.01em;
    color: var(--text-primary);
  }
  .actions {
    display: flex;
    gap: var(--space-2);
  }
  .body {
    color: var(--text-primary);
  }
</style>
