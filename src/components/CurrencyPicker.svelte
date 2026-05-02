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
    background: var(--bg-raised);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    font: inherit;
    cursor: pointer;
    min-height: 36px;
  }
  .picker:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 1px;
  }
  .picker:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
