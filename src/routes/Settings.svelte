<script lang="ts">
  import { t } from '@/i18n';
  import TopBar from './overview/TopBar.svelte';
  import Appearance from './settings/Appearance.svelte';
  import Categories from './settings/Categories.svelte';
  import General from './settings/General.svelte';
  import Backup from './settings/Backup.svelte';
  import Reset from './settings/Reset.svelte';
  import Subscriptions from './settings/Subscriptions.svelte';
  import Budgets from './settings/Budgets.svelte';
</script>

<section class="page">
  <TopBar />

  <header class="page-head">
    <h1>{$t('nav.settings')}</h1>
    <span class="section-sub">preferências do app · todas as alterações ficam salvas localmente</span>
  </header>

  <Appearance />
  <General />
  <Categories />
  <Subscriptions />
  <Budgets />
  <Backup />
  <Reset />
</section>

<style>
  .page {
    padding: 56px 48px 96px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 1100px;
    margin: 0 auto;
  }
  @media (max-width: 1024px) { .page { padding: 48px 32px 96px; gap: 20px; } }
  @media (max-width: 768px) { .page { padding: 32px 20px 96px; gap: 18px; } }
  @media (max-width: 480px) { .page { padding: 24px 16px 96px; gap: 16px; } }

  .page-head {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-left: 8px;
    margin-bottom: var(--space-2);
  }
  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: clamp(2rem, 1.8rem + 1vw, 2.6rem);
    letter-spacing: -0.025em;
    color: var(--text-primary);
  }
</style>
