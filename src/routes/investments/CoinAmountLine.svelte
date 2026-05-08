<script lang="ts">
  import { t } from '@/i18n';
  import { mutate } from '@/lib/appStore';
  import { setHoldingCoinAmount } from '@/lib/db/investments';
  import { Pencil } from 'lucide-svelte';
  import type { Holding } from '@/lib/types';

  interface Props {
    holding: Holding;
  }

  let { holding }: Props = $props();

  function editAmount() {
    if (!holding.coinId) return;
    const next = window.prompt($t('inv.crypto.editAmount'), String(holding.coinAmount ?? 0));
    if (next === null) return;
    const parsed = Number(next.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0) return;
    mutate((s) => setHoldingCoinAmount(s, holding.id, parsed));
  }
</script>

<span class="coin">
  {$t('inv.crypto.amount')}: {(holding.coinAmount ?? 0).toFixed(8)} BTC
  <button type="button" class="icon" onclick={editAmount} aria-label={$t('inv.crypto.editAmount')}>
    <Pencil size={12} />
  </button>
</span>

<style>
  .coin {
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
