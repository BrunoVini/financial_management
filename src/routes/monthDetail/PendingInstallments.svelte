<script lang="ts">
  import { t } from '@/i18n';
  import Card from '@/components/Card.svelte';
  import { CheckCircle2, Trash2 } from 'lucide-svelte';
  import { appStore, mutate, settings } from '@/lib/appStore';
  import { formatMoney } from '@/lib/money';
  import {
    installmentsDueInMonth,
    payInstallment,
    removeInstallmentPlan,
  } from '@/lib/db/installments';
  import type { MonthKey } from '@/lib/types';

  interface Props {
    monthKey: MonthKey;
    locked: boolean;
  }

  let { monthKey, locked }: Props = $props();

  let pending = $derived(installmentsDueInMonth($appStore, monthKey));

  function pay(planId: string, index: number) {
    if (locked) return;
    mutate((s) => payInstallment(s, planId, index, new Date().toISOString().slice(0, 10)));
  }

  function dropPlan(id: string) {
    if (locked) return;
    if (!confirm($t('inst.delete') + '?')) return;
    mutate((s) => removeInstallmentPlan(s, id));
  }
</script>

{#if pending.length > 0}
  <Card title={$t('inst.month.heading')}>
    <ul>
      {#each pending as p (p.plan.id + p.index)}
        <li>
          <div class="info">
            <span class="desc">{p.plan.description}</span>
            <span class="meta">
              {p.index + 1}/{p.plan.installmentCount} ·
              {formatMoney(p.amount, p.plan.currency, $settings.language)}
            </span>
          </div>
          <div class="actions">
            <button
              type="button"
              class="primary"
              disabled={locked}
              aria-label={$t('inst.pay')}
              onclick={() => pay(p.plan.id, p.index)}
            >
              <CheckCircle2 size={16} />
              {$t('inst.pay')}
            </button>
            <button
              type="button"
              class="danger"
              disabled={locked}
              aria-label={$t('inst.delete')}
              onclick={() => dropPlan(p.plan.id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </li>
      {/each}
    </ul>
  </Card>
{/if}

<style>
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: var(--bg-glass);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    flex-wrap: wrap;
  }
  .info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .desc {
    color: var(--text-primary);
    font-weight: 500;
  }
  .meta {
    color: var(--text-secondary);
    font-size: 0.82rem;
  }
  .actions {
    display: flex;
    gap: var(--space-2);
  }
  button {
    background: var(--bg-raised);
    color: var(--text-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font: inherit;
    min-height: 36px;
  }
  button.primary {
    background: var(--accent-gradient);
    color: white;
    border-color: transparent;
  }
  button.danger:hover {
    color: var(--negative);
    border-color: var(--negative);
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
