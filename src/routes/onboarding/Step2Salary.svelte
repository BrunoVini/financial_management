<script lang="ts">
  import { t } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import MoneyInput from '@/components/MoneyInput.svelte';
  import { wizard, SUPPORTED_CURRENCIES } from './state';
  import type { Currency } from '@/lib/types';

  function setHasSalary(yes: boolean) {
    wizard.update((w) => ({
      ...w,
      hasSalary: yes,
      salaryAmount: yes ? w.salaryAmount : 0,
    }));
  }

  function setDay(value: number) {
    const clamped = Math.max(1, Math.min(31, Math.floor(value || 1)));
    wizard.update((w) => ({ ...w, salaryDayOfMonth: clamped }));
  }

  // Picking a salary currency that the user hasn't enabled yet should
  // auto-enable it (and create a slot in openingBalances) so the rest
  // of the wizard stays consistent.
  function setSalaryCurrency(currency: Currency) {
    wizard.update((w) => {
      const active = w.activeCurrencies.includes(currency)
        ? w.activeCurrencies
        : [...w.activeCurrencies, currency];
      const openingBalances = { ...w.openingBalances };
      if (!(currency in openingBalances)) openingBalances[currency] = 0;
      return { ...w, salaryCurrency: currency, activeCurrencies: active, openingBalances };
    });
  }
</script>

<Card padding="lg">
  <div class="grid">
    <section>
      <h4>{$t('onboarding.salary.has')}</h4>
      <div class="radios">
        <label>
          <input
            type="radio"
            name="hasSalary"
            checked={$wizard.hasSalary}
            onchange={() => setHasSalary(true)}
          />
          {$t('onboarding.salary.yes')}
        </label>
        <label>
          <input
            type="radio"
            name="hasSalary"
            checked={!$wizard.hasSalary}
            onchange={() => setHasSalary(false)}
          />
          {$t('onboarding.salary.no')}
        </label>
      </div>
    </section>

    {#if $wizard.hasSalary}
      <section>
        <MoneyInput
          label={$t('onboarding.salary.amount')}
          bind:value={$wizard.salaryAmount}
          currency={$wizard.salaryCurrency}
          currencies={SUPPORTED_CURRENCIES}
          onCurrencyChange={setSalaryCurrency}
        />
      </section>

      <section>
        <h4>{$t('onboarding.salary.day')}</h4>
        <input
          class="day"
          type="number"
          min="1"
          max="31"
          inputmode="numeric"
          value={$wizard.salaryDayOfMonth}
          oninput={(e) => setDay(Number((e.target as HTMLInputElement).value))}
        />
      </section>
    {/if}
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
  .radios {
    display: flex;
    gap: var(--space-4);
  }
  label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
  }
  .day {
    width: 96px;
    background: var(--bg-raised);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    font: inherit;
    min-height: 36px;
  }
</style>
