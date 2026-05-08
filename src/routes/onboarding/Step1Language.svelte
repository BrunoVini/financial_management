<script lang="ts">
  import { t, setLocale } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import CurrencyDropdown from '@/components/CurrencyDropdown.svelte';
  import { DEFAULT_CURRENCY_OPTIONS } from '@/components/currencyOptions';
  import LanguageDropdown from '@/components/LanguageDropdown.svelte';
  import { wizard, SUPPORTED_CURRENCIES } from './state';
  import type { Currency, Language } from '@/lib/types';

  function setLanguage(lang: Language) {
    wizard.update((w) => ({ ...w, language: lang }));
    // Apply the locale immediately so every $t(...) on screen updates
    // as the user picks. applyWizard will sync settings.language at the
    // end of the wizard; the appStore subscriber re-syncs the locale
    // store from settings, so the two stay aligned afterwards.
    setLocale(lang);
  }

  function setDisplayCurrency(c: Currency) {
    wizard.update((w) => {
      const active = w.activeCurrencies.includes(c) ? w.activeCurrencies : [...w.activeCurrencies, c];
      return { ...w, displayCurrency: c, activeCurrencies: active };
    });
  }

  function toggleCurrency(c: Currency) {
    wizard.update((w) => {
      if (c === w.displayCurrency) return w; // display currency cannot be unselected
      const active = w.activeCurrencies.includes(c)
        ? w.activeCurrencies.filter((x) => x !== c)
        : [...w.activeCurrencies, c];
      // keep openingBalances in sync — drop entries for removed currencies, add zero for new ones
      const openingBalances: Record<Currency, number> = {};
      for (const cc of active) openingBalances[cc] = w.openingBalances[cc] ?? 0;
      return { ...w, activeCurrencies: active, openingBalances };
    });
  }
</script>

<Card padding="lg">
  <div class="grid">
    <section>
      <h4>{$t('onboarding.language')}</h4>
      <LanguageDropdown
        value={$wizard.language}
        onchange={(lang) => setLanguage(lang)}
        ariaLabel={$t('onboarding.language')}
      />
    </section>

    <section>
      <h4>{$t('onboarding.displayCurrency')}</h4>
      <p class="help">{$t('onboarding.displayCurrency.help')}</p>
      <CurrencyDropdown
        value={$wizard.displayCurrency}
        onchange={(c) => setDisplayCurrency(c)}
        ariaLabel={$t('onboarding.displayCurrency')}
      />
    </section>

    <section>
      <h4>{$t('onboarding.activeCurrencies')}</h4>
      <p class="help">{$t('onboarding.activeCurrencies.help')}</p>
      <div class="badges" role="group" aria-label={$t('onboarding.activeCurrencies')}>
        {#each SUPPORTED_CURRENCIES as c (c)}
          {@const isDisplay = c === $wizard.displayCurrency}
          {@const isActive = $wizard.activeCurrencies.includes(c)}
          {@const meta = DEFAULT_CURRENCY_OPTIONS.find((o) => o.code === c)}
          <button
            type="button"
            class="badge"
            class:on={isActive}
            class:locked={isDisplay}
            disabled={isDisplay}
            aria-pressed={isActive}
            onclick={() => toggleCurrency(c)}
          >
            <span class="flag" aria-hidden="true">{meta?.flag ?? ''}</span>
            <span class="code">{c}</span>
            {#if isDisplay}<span class="pill">main</span>{/if}
          </button>
        {/each}
      </div>
    </section>
  </div>
</Card>

<style>
  .grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }
  h4 {
    margin: 0 0 var(--space-2);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
  }
  .help {
    margin: 0 0 var(--space-3);
    color: var(--text-muted);
    font-size: 0.86rem;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    background: var(--bg-glass);
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-pill, 999px);
    padding: 8px 14px;
    cursor: pointer;
    font: inherit;
    font-size: 0.92rem;
    line-height: 1;
    transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease,
      transform 0.05s ease;
  }
  .badge:hover:not(.locked) {
    border-color: var(--text-muted);
    color: var(--text-primary);
  }
  .badge:active:not(.locked) {
    transform: scale(0.97);
  }
  .badge.on {
    background: var(--accent-gradient);
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
  }
  .badge.locked {
    cursor: not-allowed;
    background: var(--accent-gradient);
    border-color: transparent;
    color: white;
    opacity: 0.92;
  }
  .badge .flag {
    font-size: 1.05em;
  }
  .badge .code {
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  .badge .pill {
    background: rgba(255, 255, 255, 0.22);
    color: white;
    font-size: 0.62rem;
    padding: 1px 6px;
    border-radius: var(--radius-pill, 999px);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  @media (prefers-reduced-motion: reduce) {
    .badge {
      transition: none;
    }
    .badge:active:not(.locked) {
      transform: none;
    }
  }
</style>
