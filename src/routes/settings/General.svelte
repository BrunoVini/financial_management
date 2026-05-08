<script lang="ts">
  import { t } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import CurrencyPicker from '@/components/CurrencyPicker.svelte';
  import MoneyInput from '@/components/MoneyInput.svelte';
  import { mutate, settings, accounts } from '@/lib/appStore';
  import { SUPPORTED_CURRENCIES } from '@/routes/onboarding/state';
  import type { Currency } from '@/lib/types';

  function setDisplayCurrency(c: Currency) {
    mutate((s) => {
      const active = s.settings.activeCurrencies.includes(c)
        ? s.settings.activeCurrencies
        : [...s.settings.activeCurrencies, c];
      return { ...s, settings: { ...s.settings, displayCurrency: c, activeCurrencies: active } };
    });
  }

  function isCurrencyInUse(c: Currency): boolean {
    return $accounts.some((a) => a.currency === c);
  }

  function toggleActiveCurrency(c: Currency) {
    if (c === $settings.displayCurrency) return;
    if ($settings.activeCurrencies.includes(c) && isCurrencyInUse(c)) return;
    mutate((s) => {
      const next = s.settings.activeCurrencies.includes(c)
        ? s.settings.activeCurrencies.filter((x) => x !== c)
        : [...s.settings.activeCurrencies, c];
      return { ...s, settings: { ...s.settings, activeCurrencies: next } };
    });
  }

  function setSalaryAmount(value: number) {
    mutate((s) => ({ ...s, settings: { ...s.settings, salaryAmount: value } }));
  }

  function setSalaryCurrency(c: Currency) {
    mutate((s) => ({ ...s, settings: { ...s.settings, salaryCurrency: c } }));
  }

  function setSalaryDay(value: number) {
    const clamped = Math.max(1, Math.min(31, Math.floor(value || 1)));
    mutate((s) => ({ ...s, settings: { ...s.settings, salaryDayOfMonth: clamped } }));
  }
</script>

<Card title={$t('settings.section.general')}>
  <section>
    <h4>{$t('settings.general.displayCurrency')}</h4>
    <CurrencyPicker
      value={$settings.displayCurrency}
      options={SUPPORTED_CURRENCIES}
      onchange={setDisplayCurrency}
    />
  </section>

  <section>
    <h4>{$t('settings.general.activeCurrencies')}</h4>
    <div class="badges">
      {#each SUPPORTED_CURRENCIES as c (c)}
        {@const isDisplay = c === $settings.displayCurrency}
        {@const active = $settings.activeCurrencies.includes(c)}
        {@const inUse = active && isCurrencyInUse(c)}
        {@const locked = isDisplay || inUse}
        <button
          type="button"
          class="badge"
          class:active
          class:locked
          disabled={locked}
          aria-pressed={active}
          title={isDisplay ? 'Moeda principal' : inUse ? 'Em uso por uma conta' : ''}
          onclick={() => toggleActiveCurrency(c)}
        >
          {c}
        </button>
      {/each}
    </div>
  </section>

  <section>
    <h4>{$t('settings.general.salary.amount')}</h4>
    <MoneyInput
      value={$settings.salaryAmount}
      currency={$settings.salaryCurrency}
      currencies={$settings.activeCurrencies}
      onValueChange={setSalaryAmount}
      onCurrencyChange={setSalaryCurrency}
    />
    <div class="below">
      <label class="day">
        <span>{$t('settings.general.salary.day')}</span>
        <input
          type="number"
          min="1"
          max="31"
          inputmode="numeric"
          value={$settings.salaryDayOfMonth}
          oninput={(e) => setSalaryDay(Number((e.target as HTMLInputElement).value))}
        />
      </label>
    </div>
  </section>
</Card>

<style>
  section {
    margin-bottom: var(--space-5);
  }
  h4 {
    margin: 0 0 var(--space-2);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .badge {
    font: inherit;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 0.85rem;
    letter-spacing: 0.04em;
    padding: 8px 16px;
    border-radius: var(--radius-pill);
    background: var(--bg-glass);
    color: var(--text-secondary);
    border: 1px solid transparent;
    cursor: pointer;
    transition: background var(--motion-fast), color var(--motion-fast), border-color var(--motion-fast);
  }
  .badge:hover:not(:disabled) {
    background: rgba(124, 148, 116, 0.14);
    color: var(--text-primary);
  }
  .badge.active {
    background: rgba(124, 148, 116, 0.18);
    color: var(--accent-primary);
    border-color: rgba(124, 148, 116, 0.45);
  }
  .badge.locked { cursor: not-allowed; opacity: 0.7; }
  .below {
    margin-top: var(--space-3);
  }
  .day {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: 0.78rem;
    color: var(--text-secondary);
  }
  .day input {
    width: 96px;
    background: var(--bg-raised);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    min-height: 36px;
    font: inherit;
  }
</style>
