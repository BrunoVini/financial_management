<script lang="ts">
  import { params } from 'svelte-spa-router';
</script>

<section>
  <h1>Month {$params?.key ?? ''}</h1>
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
