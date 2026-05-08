<script lang="ts">
  import type { Snippet } from 'svelte';

  type Tint = 'sage' | 'rose' | 'honey' | 'cream';

  interface Props {
    label: string;
    tint?: Tint;
    value: string;
    /** When true, value uses the tint's brand color (sage / rose-deep / honey-deep). */
    valueTinted?: boolean;
    note?: string;
    children?: Snippet;
  }

  let {
    label,
    tint = 'cream',
    value,
    valueTinted = false,
    note,
    children,
  }: Props = $props();
</script>

<article class="stat" data-tint={tint} data-tinted={valueTinted ? 'on' : 'off'}>
  <span class="label">{label}</span>
  <strong class="value">{value}</strong>
  {#if note}<span class="note">{note}</span>{/if}
  {#if children}<div class="extra">{@render children()}</div>{/if}
</article>

<style>
  .stat {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 22px;
    border-radius: var(--radius-xxl);
    background: var(--bg-raised);
    /* Inset top-line highlight + soft outer shadow gives the "raised
       paper" feel from the wireframe. */
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.7) inset,
      0 4px 14px rgba(46, 42, 38, 0.05);
    border: 1px solid var(--border-subtle);
    min-height: 130px;
    overflow: hidden;
    position: relative;
  }

  /* Each tint blends a soft, fairly visible color wash from the top.
     The wireframe uses bigger color presence than I had previously —
     ~0% to 70% gradient stops — so the four cards read as a coordinated
     set. */
  .stat[data-tint='sage'] {
    background: linear-gradient(180deg, #ecf0e4 0%, var(--bg-raised) 70%);
  }
  .stat[data-tint='rose'] {
    background: linear-gradient(180deg, #f5e3df 0%, var(--bg-raised) 70%);
  }
  .stat[data-tint='honey'] {
    background: linear-gradient(180deg, #f6ebd5 0%, var(--bg-raised) 70%);
  }
  .stat[data-tint='cream'] {
    background: var(--bg-raised);
  }

  /* Dark theme: warmer translucent washes over the coffee paper. */
  :global([data-theme='dark']) .stat[data-tint='sage'] {
    background: linear-gradient(180deg, rgba(124, 148, 116, 0.18) 0%, var(--bg-raised) 70%);
  }
  :global([data-theme='dark']) .stat[data-tint='rose'] {
    background: linear-gradient(180deg, rgba(212, 168, 160, 0.20) 0%, var(--bg-raised) 70%);
  }
  :global([data-theme='dark']) .stat[data-tint='honey'] {
    background: linear-gradient(180deg, rgba(214, 168, 90, 0.18) 0%, var(--bg-raised) 70%);
  }
  :global([data-theme='dark']) .stat {
    box-shadow:
      0 1px 0 rgba(245, 239, 230, 0.04) inset,
      0 4px 14px rgba(0, 0, 0, 0.28);
  }

  .label {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.86rem;
    color: var(--text-muted);
    margin-bottom: 4px;
  }
  .value {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 1.85rem;
    line-height: 1;
    letter-spacing: -0.025em;
    font-variant-numeric: tabular-nums;
    color: var(--text-primary);
  }
  /* When the card carries a tint and `valueTinted` is on, the number
     itself takes the tint's ink color — like the wireframe. */
  .stat[data-tinted='on'][data-tint='sage'] .value { color: #5a7158; }
  .stat[data-tinted='on'][data-tint='rose'] .value { color: #b4837a; }
  .stat[data-tinted='on'][data-tint='honey'] .value { color: #a87a3a; }
  :global([data-theme='dark']) .stat[data-tinted='on'][data-tint='sage'] .value {
    color: #b4ce99;
  }
  :global([data-theme='dark']) .stat[data-tinted='on'][data-tint='rose'] .value {
    color: #e0bfb7;
  }
  :global([data-theme='dark']) .stat[data-tinted='on'][data-tint='honey'] .value {
    color: #e0b66e;
  }
  .note {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 4px;
  }
  .extra {
    margin-top: var(--space-2);
  }
</style>
