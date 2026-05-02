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
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-subtle);
    box-shadow: var(--shadow-glass);
    backdrop-filter: blur(10px);
    transition: border-color var(--motion-fast);
  }
  .card[data-variant='glass'] {
    background: var(--bg-glass);
  }
  .card[data-variant='raised'] {
    background: var(--bg-raised);
    backdrop-filter: none;
  }
  .card[data-padding='sm'] {
    padding: var(--space-3);
  }
  .card[data-padding='md'] {
    padding: var(--space-4);
  }
  .card[data-padding='lg'] {
    padding: var(--space-5);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }
  h3 {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .actions {
    display: flex;
    gap: var(--space-2);
  }
  .body {
    color: var(--text-primary);
  }
</style>
