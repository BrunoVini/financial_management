<script lang="ts">
  import { push } from 'svelte-spa-router';
  import { t, locale } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import Modal from '@/components/Modal.svelte';
  import { mutate } from '@/lib/appStore';
  import { defaultStore } from '@/lib/storage';
  import { Trash2 } from 'lucide-svelte';

  let open = $state(false);
  let typed = $state('');
  let confirmWord = $derived($locale === 'pt-BR' ? 'EXCLUIR' : 'ERASE');
  let canConfirm = $derived(typed.trim().toUpperCase() === confirmWord);

  function openModal() {
    typed = '';
    open = true;
  }

  function closeModal() {
    open = false;
  }

  function doReset() {
    if (!canConfirm) return;
    mutate(() => defaultStore());
    open = false;
    push('/onboarding');
  }
</script>

<Card title={$t('settings.section.danger')}>
  <p class="hint">{$t('settings.reset.body')}</p>
  <button type="button" class="danger" onclick={openModal}>
    <Trash2 size={16} />
    {$t('settings.reset.button')}
  </button>
</Card>

<Modal {open} title={$t('settings.reset.title')} onclose={closeModal} width="sm">
  <p class="body">{$t('settings.reset.body')}</p>
  <label class="confirm">
    <span>{$t('settings.reset.confirm.label')}</span>
    <input
      type="text"
      placeholder={$t('settings.reset.confirm.placeholder')}
      autocomplete="off"
      value={typed}
      oninput={(e) => (typed = (e.target as HTMLInputElement).value)}
    />
  </label>
  {#snippet footer()}
    <button type="button" onclick={closeModal}>{$t('common.cancel')}</button>
    <button type="button" class="danger" disabled={!canConfirm} onclick={doReset}>
      {$t('settings.reset.confirm.action')}
    </button>
  {/snippet}
</Modal>

<style>
  .hint {
    margin: 0 0 var(--space-3);
    color: var(--text-secondary);
    font-size: 0.86rem;
    line-height: 1.5;
  }
  .body {
    margin: 0 0 var(--space-3);
    color: var(--text-primary);
    line-height: 1.5;
  }
  .confirm {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    color: var(--text-secondary);
    font-size: 0.82rem;
  }
  .confirm input {
    background: var(--bg-glass);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    font: inherit;
    min-height: 36px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  button {
    padding: var(--space-2) var(--space-4);
    background: var(--bg-glass);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    cursor: pointer;
    font: inherit;
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
  button.danger {
    background: var(--negative);
    color: white;
    border-color: transparent;
  }
  button.danger:hover {
    filter: brightness(1.1);
  }
  button.danger:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    filter: none;
  }
</style>
