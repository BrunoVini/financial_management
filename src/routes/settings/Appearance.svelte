<script lang="ts">
  import { t } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import { mutate, settings } from '@/lib/appStore';
  import type { Language, ThemeName } from '@/lib/types';

  function changeLanguage(e: Event) {
    const lang = (e.target as HTMLSelectElement).value as Language;
    mutate((s) => ({ ...s, settings: { ...s.settings, language: lang } }));
  }

  function changeTheme(e: Event) {
    const next = (e.target as HTMLSelectElement).value as ThemeName;
    mutate((s) => ({ ...s, settings: { ...s.settings, theme: next } }));
  }
</script>

<Card title={$t('settings.section.appearance')}>
  <div class="grid">
    <label>
      <span>{$t('settings.language')}</span>
      <select value={$settings.language} onchange={changeLanguage}>
        <option value="pt-BR">Português</option>
        <option value="en">English</option>
      </select>
    </label>
    <label>
      <span>{$t('settings.theme')}</span>
      <select value={$settings.theme} onchange={changeTheme}>
        <option value="dark">{$t('settings.theme.dark')}</option>
        <option value="light">{$t('settings.theme.light')}</option>
      </select>
    </label>
  </div>
</Card>

<style>
  .grid {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 540px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
  label {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    color: var(--text-secondary);
    font-size: 0.82rem;
  }
  select {
    background: var(--bg-raised);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    min-height: 36px;
    font: inherit;
  }
</style>
