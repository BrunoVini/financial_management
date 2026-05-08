<script lang="ts">
  import { t, setLocale } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import CurrencyPicker from '@/components/CurrencyPicker.svelte';
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
      <CurrencyPicker
        value={$wizard.displayCurrency}
        options={SUPPORTED_CURRENCIES}
        onchange={(c) => setDisplayCurrency(c)}
      />
    </section>

    <section>
      <h4>{$t('onboarding.activeCurrencies')}</h4>
      <p class="help">{$t('onboarding.activeCurrencies.help')}</p>
      <div class="checks">
        {#each SUPPORTED_CURRENCIES as c (c)}
          {@const isDisplay = c === $wizard.displayCurrency}
          <label class:locked={isDisplay}>
            <input
              type="checkbox"
              checked={$wizard.activeCurrencies.includes(c)}
              disabled={isDisplay}
              onchange={() => toggleCurrency(c)}
            />
            {c}
            {#if isDisplay}<span class="badge">main</span>{/if}
          </label>
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
  .checks {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
  }
  label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
  }
  label.locked {
    opacity: 0.85;
  }
  .badge {
    background: var(--accent-gradient);
    color: white;
    font-size: 0.65rem;
    padding: 1px 6px;
    border-radius: var(--radius-pill);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
</style>
