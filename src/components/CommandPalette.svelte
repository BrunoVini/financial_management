<script lang="ts">
  import { t } from '@/i18n';
  import { settings } from '@/lib/appStore';
  import { theme } from '@/theme';
  import { buildCommands, type Cmd } from './commandPalette/commands';

  let open = $state(false);
  let query = $state('');
  let activeIndex = $state(0);
  let inputEl: HTMLInputElement | null = $state(null);

  let commands = $derived<Cmd[]>(buildCommands($t, $settings, $theme));

  let filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  });

  function show() {
    open = true;
    query = '';
    activeIndex = 0;
    queueMicrotask(() => inputEl?.focus());
  }

  function hide() {
    open = false;
  }

  function execute(c: Cmd) {
    hide();
    c.run();
  }

  function handleGlobalKey(e: KeyboardEvent) {
    const isCmd = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
    if (isCmd) {
      e.preventDefault();
      if (open) hide();
      else show();
    } else if (open && e.key === 'Escape') {
      hide();
    }
  }

  function handleListKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(filtered.length - 1, activeIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(0, activeIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const c = filtered[activeIndex];
      if (c) execute(c);
    }
  }
</script>

<svelte:window onkeydown={handleGlobalKey} />

{#if open}
  <button type="button" class="backdrop" aria-label="Close" onclick={hide}></button>
  <div
    class="palette"
    role="dialog"
    aria-modal="true"
    aria-label="Command palette"
    tabindex="-1"
    onkeydown={handleListKey}
  >
    <input
      bind:this={inputEl}
      type="text"
      placeholder="Buscar comando…"
      bind:value={query}
      oninput={() => (activeIndex = 0)}
    />
    <ul role="listbox">
      {#each filtered as c, i (c.id)}
        {@const Icon = c.icon}
        <li role="option" aria-selected={i === activeIndex}>
          <button
            type="button"
            class="row"
            class:active={i === activeIndex}
            onclick={() => execute(c)}
            onmouseenter={() => (activeIndex = i)}
          >
            <Icon size={16} />
            <span>{c.label}</span>
          </button>
        </li>
      {/each}
      {#if filtered.length === 0}
        <li class="empty">—</li>
      {/if}
    </ul>
    <footer>
      <kbd>↑</kbd><kbd>↓</kbd> navegar · <kbd>Enter</kbd> executar · <kbd>Esc</kbd> fechar
    </footer>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    border: none;
    z-index: 60;
    cursor: default;
    animation: fade var(--motion-base) ease-out;
  }
  .palette {
    position: fixed;
    top: 12vh;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 2 * var(--space-4));
    max-width: 520px;
    background: var(--bg-raised);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-glass);
    display: flex;
    flex-direction: column;
    max-height: 70vh;
    z-index: 61;
    animation: rise var(--motion-base) ease-out;
  }
  input {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-primary);
    padding: var(--space-3) var(--space-4);
    font: inherit;
    min-height: 44px;
    outline: none;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: var(--space-2);
    overflow-y: auto;
    flex: 1;
  }
  .row {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    cursor: pointer;
    text-align: left;
    font: inherit;
  }
  .row.active {
    background: var(--bg-glass);
    color: var(--text-primary);
  }
  .empty {
    color: var(--text-muted);
    padding: var(--space-2) var(--space-3);
  }
  footer {
    border-top: 1px solid var(--border-subtle);
    padding: var(--space-2) var(--space-3);
    color: var(--text-muted);
    font-size: 0.78rem;
  }
  kbd {
    background: var(--bg-glass);
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    padding: 0 5px;
    font-family: inherit;
    font-size: 0.78em;
    margin: 0 2px;
  }
  @keyframes fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translate(-50%, -8px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
</style>
