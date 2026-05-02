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
  import { settings } from '@/lib/appStore';
  import { get } from 'svelte/store';

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

  onMount(() => {
    const s = get(settings);
    if (!s.onboarded && router.location !== '/onboarding') {
      push('/onboarding');
    }
  });
</script>

<div class="layout" class:fullscreen={router.location === '/onboarding'}>
  {#if router.location !== '/onboarding'}
    <Sidebar />
  {/if}
  <main>
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
  @media (min-width: 769px) {
    main {
      padding-bottom: 0;
    }
  }
</style>
