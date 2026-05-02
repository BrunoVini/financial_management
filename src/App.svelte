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
</script>

<div class="layout">
  <Sidebar />
  <main>
    <Router {routes} />
  </main>
  <BottomNav />
</div>

<style>
  .layout {
    display: flex;
    min-height: 100vh;
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
