<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { push } from 'svelte-spa-router';
  import { t, detectLocale } from '@/i18n';
  import { wizard, defaultWizardState } from './onboarding/state';
  import Step1Language from './onboarding/Step1Language.svelte';
  import Step2Salary from './onboarding/Step2Salary.svelte';
  import Step3Balances from './onboarding/Step3Balances.svelte';
  import Step4Holdings from './onboarding/Step4Holdings.svelte';
  import { mutate } from '@/lib/appStore';
  import { applyWizard } from './onboarding/finish';

  onMount(() => {
    const lang = detectLocale(navigator.language || 'pt-BR');
    wizard.set(defaultWizardState(lang));
  });

  function next() {
    wizard.update((w) => ({ ...w, step: Math.min(4, w.step + 1) as 1 | 2 | 3 | 4 }));
  }
  function back() {
    wizard.update((w) => ({ ...w, step: Math.max(1, w.step - 1) as 1 | 2 | 3 | 4 }));
  }

  function finish() {
    const w = get(wizard);
    const today = new Date();
    mutate((store) => applyWizard(store, w, today));
    push('/');
  }
</script>

<section class="wizard">
  <header>
    <h1>{$t('onboarding.welcome.title')}</h1>
    <p class="subtitle">{$t('onboarding.welcome.subtitle')}</p>
    <ol class="steps" aria-label="Progress">
      {#each [1, 2, 3, 4] as n (n)}
        <li class:active={$wizard.step === n} class:done={$wizard.step > n}>
          <span class="dot">{n}</span>
          <span class="label">{$t(`onboarding.step.${n}`)}</span>
        </li>
      {/each}
    </ol>
  </header>

  <div class="step">
    {#if $wizard.step === 1}
      <Step1Language />
    {:else if $wizard.step === 2}
      <Step2Salary />
    {:else if $wizard.step === 3}
      <Step3Balances />
    {:else if $wizard.step === 4}
      <Step4Holdings />
    {/if}
  </div>

  <footer>
    <button type="button" onclick={back} disabled={$wizard.step === 1}>
      {$t('onboarding.back')}
    </button>
    {#if $wizard.step < 4}
      <button type="button" class="primary" onclick={next}>
        {$t('onboarding.next')}
      </button>
    {:else}
      <button type="button" class="primary" onclick={finish}>
        {$t('onboarding.finish')}
      </button>
    {/if}
  </footer>
</section>

<style>
  .wizard {
    max-width: 720px;
    margin: 0 auto;
    padding: var(--space-7) var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
  header {
    text-align: center;
  }
  h1 {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 500;
    font-size: clamp(2rem, 1.8rem + 1vw, 2.8rem);
    letter-spacing: -0.025em;
    margin: 0 0 var(--space-2);
    color: var(--text-primary);
  }
  .subtitle {
    font-family: var(--font-body);
    color: var(--text-secondary);
    font-size: 1rem;
    margin: 0 0 var(--space-5);
  }
  .steps {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    gap: var(--space-3);
    justify-content: center;
    flex-wrap: wrap;
  }
  .steps li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-muted);
    font-size: 0.86rem;
  }
  .steps li.active {
    color: var(--text-primary);
    font-weight: 600;
  }
  .steps li.done {
    color: var(--accent-primary);
  }
  .dot {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid var(--border-strong);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.78rem;
    font-weight: 600;
    transition: background var(--motion-base), color var(--motion-base);
  }
  .steps li.active .dot {
    background: var(--accent-gradient);
    color: white;
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(124, 148, 116, 0.22);
  }
  .steps li.done .dot {
    background: rgba(124, 148, 116, 0.16);
    color: var(--accent-primary);
    border-color: transparent;
  }
  footer {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
  }
  button {
    padding: 12px var(--space-5);
    background: var(--bg-glass);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-pill);
    cursor: pointer;
    font: inherit;
    font-weight: 600;
    min-height: 44px;
    transition: border-color var(--motion-fast), color var(--motion-fast);
  }
  button:hover:not(:disabled) {
    border-color: var(--text-muted);
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  button.primary {
    background: var(--accent-gradient);
    color: white;
    border-color: transparent;
    box-shadow: 0 4px 14px rgba(124, 148, 116, 0.25);
  }
  button.primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(124, 148, 116, 0.32);
  }
</style>
