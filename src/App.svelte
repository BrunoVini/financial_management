<script lang="ts">
  import Router from 'svelte-spa-router';
  import Sidebar from '@/components/Sidebar.svelte';
  import BottomNav from '@/components/BottomNav.svelte';
  import Overview from '@/routes/Overview.svelte';
  import Months from '@/routes/Months.svelte';
  import MonthDetail from '@/routes/MonthDetail.svelte';
  import Investments from '@/routes/Investments.svelte';
  import Settings from '@/routes/Settings.svelte';
  import Onboarding from '@/routes/Onboarding.svelte';
  import { theme, applyThemeToDocument } from '@/theme';
  import { onMount } from 'svelte';
  import { push, router } from 'svelte-spa-router';
  import { settings, mutate } from '@/lib/appStore';
  import { get } from 'svelte/store';
  import { ensureRates } from '@/lib/rates';
  import { rolloverIfNeeded } from '@/lib/db/months';

  let ratesStale = $state(false);

  const routes = {
    '/': Overview,
    '/months': Months,
    '/months/:key': MonthDetail,
    '/investments': Investments,
    '/settings': Settings,
    '/onboarding': Onboarding,
  };

  $effect(() => {
    applyThemeToDocument($theme);
  });

  async function bootRates(symbols: string[]) {
    if (symbols.length === 0) return;
    try {
      const result = await ensureRates(symbols);
      ratesStale = result.stale;
    } catch {
      ratesStale = true;
    }
  }

  function bootRollover() {
    mutate((store) => rolloverIfNeeded(store, new Date()).store);
  }

  onMount(() => {
    const s = get(settings);
    if (!s.onboarded) {
      if (router.location !== '/onboarding') push('/onboarding');
      return; // skip rates + rollover until the user finishes onboarding
    }
    bootRollover();
    bootRates(s.activeCurrencies);
  });
</script>

<div class="layout" class:fullscreen={router.location === '/onboarding'}>
  {#if router.location !== '/onboarding'}
    <Sidebar />
  {/if}
  <main>
    {#if ratesStale && router.location !== '/onboarding'}
      <div class="banner" role="status">Cotações desatualizadas — exibindo último cache.</div>
    {/if}
    <Router {routes} />
  </main>
  {#if router.location !== '/onboarding'}
    <BottomNav />
  {/if}
</div>

<style>
  .layout {
    display: flex;
    min-height: 100vh;
  }
  .layout.fullscreen {
    display: block;
  }
  main {
    flex: 1;
    padding-bottom: 80px;
  }
  .banner {
    margin: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    background: rgba(251, 191, 36, 0.12);
    border: 1px solid var(--warning);
    color: var(--warning);
    font-size: 0.86rem;
  }
  @media (min-width: 769px) {
    main {
      padding-bottom: 0;
    }
  }
</style>
