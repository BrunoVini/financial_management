<script lang="ts">
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { t } from '@/i18n';
  import { wizard, defaultWizardState } from './onboarding/state';
  import { detectLocale } from '@/i18n';
  import Step1Language from './onboarding/Step1Language.svelte';
  import Step2Salary from './onboarding/Step2Salary.svelte';
  import Step3Balances from './onboarding/Step3Balances.svelte';

  onMount(() => {
    const lang = detectLocale(navigator.language || 'pt-BR');
    wizard.set(defaultWizardState(lang));
  });

  function next() {
    wizard.update((w) => ({ ...w, step: Math.min(4, (w.step + 1) as 1 | 2 | 3 | 4) }));
  }
  function back() {
    wizard.update((w) => ({ ...w, step: Math.max(1, (w.step - 1) as 1 | 2 | 3 | 4) }));
  }

  // Phase 2 milestone: Steps 2-4 + finish handler land in P2.11..P2.14.
  function finishPlaceholder() {
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
    {:else}
      <p>Step {$wizard.step} — coming up.</p>
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
      <button type="button" class="primary" onclick={finishPlaceholder}>
        {$t('onboarding.finish')}
      </button>
    {/if}
  </footer>
</section>

<style>
  .wizard {
    max-width: 720px;
    margin: 0 auto;
    padding: var(--space-6) var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }
  header {
    text-align: center;
  }
  h1 {
    font-size: clamp(1.6rem, 1.4rem + 1vw, 2.2rem);
    margin: 0 0 var(--space-2);
    background: var(--accent-gradient);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .subtitle {
    color: var(--text-secondary);
    margin: 0 0 var(--space-5);
  }
  .steps {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    gap: var(--space-2);
    justify-content: center;
    flex-wrap: wrap;
  }
  .steps li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-muted);
    font-size: 0.82rem;
  }
  .steps li.active {
    color: var(--text-primary);
    font-weight: 500;
  }
  .steps li.done {
    color: var(--accent-primary);
  }
  .dot {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid var(--border-strong);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
  }
  .steps li.active .dot {
    background: var(--accent-gradient);
    color: white;
    border-color: transparent;
  }
  footer {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
  }
  button {
    padding: var(--space-3) var(--space-5);
    background: var(--bg-raised);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    cursor: pointer;
    font: inherit;
    min-height: 44px;
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  button.primary {
    background: var(--accent-gradient);
    color: white;
    border-color: transparent;
  }
</style>
