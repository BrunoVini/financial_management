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
  import { appStore, settings, mutate } from '@/lib/appStore';
  import { get } from 'svelte/store';
  import { ensureRates } from '@/lib/rates';
  import { rolloverIfNeeded, monthKey as toMonthKey } from '@/lib/db/months';
  import { applyDueSubscriptions } from '@/lib/db/recurring';
  import { transactionModal, closeTransactionModal } from '@/lib/uiStore';
  import ExpenseModal from '@/routes/transactions/ExpenseModal.svelte';
  import IncomeModal from '@/routes/transactions/IncomeModal.svelte';
  import FxTransferModal from '@/routes/transactions/FxTransferModal.svelte';
  import SalaryReceivedModal from '@/routes/transactions/SalaryReceivedModal.svelte';
  import InstallmentModal from '@/routes/installments/InstallmentModal.svelte';
  import CommandPalette from '@/components/CommandPalette.svelte';

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
      const result = await ensureRates(symbols, get(appStore).ratesCache);
      ratesStale = result.stale;
      if (result.cache) {
        const fresh = result.cache;
        mutate((store) => ({ ...store, ratesCache: fresh }));
      }
    } catch {
      ratesStale = true;
    }
  }

  function bootRollover() {
    const today = new Date();
    mutate((store) => {
      const rolled = rolloverIfNeeded(store, today).store;
      // Apply subscriptions due this month after rollover so the new
      // month — if any — already has its recurring expenses recorded.
      return applyDueSubscriptions(rolled, toMonthKey(today), today);
    });
  }

  let booted = false;

  function runBoot(currencies: string[]) {
    if (booted) return;
    booted = true;
    bootRollover();
    bootRates(currencies);
  }

  onMount(() => {
    const s = get(settings);
    if (!s.onboarded && router.location !== '/onboarding') {
      push('/onboarding');
    } else if (s.onboarded) {
      runBoot(s.activeCurrencies);
    }
  });

  // After onboarding completes, settings.onboarded flips and triggers
  // boot — without this, ratesCache stays null and Overview shows NaN
  // until the user reloads the page.
  $effect(() => {
    if ($settings.onboarded) {
      runBoot($settings.activeCurrencies);
    }
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

<ExpenseModal open={$transactionModal === 'expense'} onclose={closeTransactionModal} />
<IncomeModal open={$transactionModal === 'income'} onclose={closeTransactionModal} />
<FxTransferModal open={$transactionModal === 'fx'} onclose={closeTransactionModal} />
<SalaryReceivedModal open={$transactionModal === 'salary'} onclose={closeTransactionModal} />
<InstallmentModal open={$transactionModal === 'installment'} onclose={closeTransactionModal} />
<CommandPalette />

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
