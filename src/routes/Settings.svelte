<script lang="ts">
  import { t } from '@/i18n';
  import Appearance from './settings/Appearance.svelte';
  import Categories from './settings/Categories.svelte';
</script>

<section class="page">
  <h1>{$t('nav.settings')}</h1>
  <Appearance />
  <Categories />
</section>

<style>
  .page {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: 880px;
  }
  h1 {
    font-size: var(--space-6);
    margin: 0;
  }
</style>
