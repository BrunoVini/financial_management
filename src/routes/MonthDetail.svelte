<script lang="ts">
  import { router } from 'svelte-spa-router';

  function readKey(): string {
    const params = router.params;
    if (params && !Array.isArray(params) && 'key' in params) {
      return (params as Record<string, string>).key ?? '';
    }
    return '';
  }
</script>

<section>
  <h1>Month {readKey()}</h1>
  <p>Coming in Phase 2.</p>
</section>

<style>
  section {
    padding: var(--space-5);
  }
  h1 {
    font-size: var(--space-6);
    margin: 0 0 var(--space-4);
  }
</style>
