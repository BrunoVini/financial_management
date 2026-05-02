<script lang="ts">
  import { get } from 'svelte/store';
  import { t } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import { appStore, mutate } from '@/lib/appStore';
  import { backupFilename, validateImportedStore } from '@/lib/backup';
  import { Download, Upload } from 'lucide-svelte';

  let fileInput: HTMLInputElement | null = $state(null);
  let error: string | null = $state(null);

  function exportData() {
    const data = JSON.stringify(get(appStore), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFilename(new Date());
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function pickFile() {
    error = null;
    fileInput?.click();
  }

  async function handleFile(e: Event) {
    error = null;
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      error = $t('settings.backup.import.invalid');
      target.value = '';
      return;
    }
    const result = validateImportedStore(parsed);
    if (!result.ok) {
      error = $t('settings.backup.import.invalid');
      target.value = '';
      return;
    }
    if (!confirm($t('settings.backup.import.confirm'))) {
      target.value = '';
      return;
    }
    mutate(() => result.store);
    target.value = '';
  }
</script>

<Card title={$t('settings.section.backup')}>
  <div class="row">
    <button type="button" onclick={exportData}>
      <Download size={16} />
      {$t('settings.backup.export')}
    </button>
    <button type="button" onclick={pickFile}>
      <Upload size={16} />
      {$t('settings.backup.import')}
    </button>
    <input
      bind:this={fileInput}
      type="file"
      accept="application/json"
      onchange={handleFile}
      hidden
    />
  </div>
  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}
</Card>

<style>
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  button {
    background: var(--bg-raised);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-4);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    font: inherit;
  }
  .error {
    margin: var(--space-3) 0 0;
    color: var(--negative);
    font-size: 0.86rem;
  }
</style>
