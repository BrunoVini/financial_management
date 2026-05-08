<script lang="ts">
  import type { Currency } from '@/lib/types';

  interface Props {
    value: Currency;
    options: Currency[];
    disabled?: boolean;
    ariaLabel?: string;
    onchange?: (next: Currency) => void;
  }

  let { value = $bindable(), options, disabled = false, ariaLabel, onchange }: Props = $props();

  function handle(e: Event) {
    const next = (e.target as HTMLSelectElement).value;
    value = next;
    onchange?.(next);
  }
</script>

<select
  class="picker"
  aria-label={ariaLabel ?? 'Currency'}
  {disabled}
  {value}
  onchange={handle}
>
  {#each options as opt (opt)}
    <option value={opt}>{opt}</option>
  {/each}
</select>

<style>
  .picker {
    background: var(--bg-glass);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: 8px var(--space-3);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    min-height: 40px;
    transition: border-color var(--motion-fast);
  }
  .picker:hover {
    border-color: var(--text-muted);
  }
  .picker:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
  .picker:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
