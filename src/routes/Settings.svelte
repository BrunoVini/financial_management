<script lang="ts">
  import { t, setLocale, locale } from '@/i18n';
  import { setTheme, applyThemeToDocument, theme } from '@/theme';
  import type { Language, ThemeName } from '@/lib/types';

  function changeLocale(e: Event) {
    setLocale((e.target as HTMLSelectElement).value as Language);
  }

  function changeTheme(e: Event) {
    const name = (e.target as HTMLSelectElement).value as ThemeName;
    setTheme(name);
    applyThemeToDocument($theme);
  }
</script>

<section>
  <h1>{$t('nav.settings')}</h1>

  <label>
    Language
    <select onchange={changeLocale} value={$locale}>
      <option value="pt-BR">Português</option>
      <option value="en">English</option>
    </select>
  </label>

  <label>
    Theme
    <select onchange={changeTheme} value={$theme.name}>
      <option value="dark">Dark</option>
      <option value="light">Light</option>
    </select>
  </label>
</section>

<style>
  section {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: 480px;
  }
  h1 {
    font-size: var(--space-6);
    margin: 0;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    color: var(--text-secondary);
  }
  select {
    padding: var(--space-2) var(--space-3);
    background: var(--bg-raised);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }
</style>
