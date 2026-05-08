<script lang="ts">
  import { t } from '@/i18n';
  import { mutate } from '@/lib/appStore';
  import { setHoldingShareAmount } from '@/lib/db/investments';
  import { Pencil } from 'lucide-svelte';
  import type { Holding } from '@/lib/types';

  interface Props {
    holding: Holding;
  }

  let { holding }: Props = $props();

  function editAmount() {
    if (!holding.ticker) return;
    const next = window.prompt($t('inv.stock.editAmount'), String(holding.shareAmount ?? 0));
    if (next === null) return;
    const parsed = Number(next.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0) return;
    mutate((s) => setHoldingShareAmount(s, holding.id, parsed));
  }
</script>

<span class="shares">
  {holding.ticker} · {holding.shareAmount ?? 0} {$t('inv.stock.shares')}
  <button type="button" class="icon" onclick={editAmount} aria-label={$t('inv.stock.editAmount')}>
    <Pencil size={12} />
  </button>
</span>

<style>
  .shares {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.72rem;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    margin-top: 2px;
  }
  .icon {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px;
    line-height: 0;
    min-height: 0;
  }
</style>
