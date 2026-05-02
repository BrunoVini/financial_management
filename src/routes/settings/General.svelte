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
    <div class="checks">
      {#each SUPPORTED_CURRENCIES as c (c)}
        {@const isDisplay = c === $settings.displayCurrency}
        {@const checked = $settings.activeCurrencies.includes(c)}
        {@const inUse = checked && isCurrencyInUse(c)}
        <label class:locked={isDisplay || inUse} title={inUse ? 'In use by an account' : ''}>
          <input
            type="checkbox"
            {checked}
            disabled={isDisplay || inUse}
            onchange={() => toggleActiveCurrency(c)}
          />
          {c}
        </label>
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
  .checks {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
  }
  label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
  label.locked {
    opacity: 0.6;
  }
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
