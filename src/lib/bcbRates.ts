import type { BcbCache } from './types';

/**
 * BCB SGS series 12 = CDI (taxa diária, % a.d.). The endpoint returns
 * an array `[{ data: 'DD/MM/YYYY', valor: '0.053400' }]` where `valor`
 * is the daily percent (not yet decimal). Requesting `ultimos/1` keeps
 * the payload tiny.
 */
export const BCB_CDI_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json';

export interface BcbResult {
  cdiDaily: number;
  fetchedAt: string;
  stale: boolean;
  cache: BcbCache | null;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchCdi(): Promise<BcbCache> {
  const res = await fetch(BCB_CDI_URL);
  if (!res.ok) throw new Error(`bcb ${res.status}`);
  const json = (await res.json()) as Array<{ data: string; valor: string }>;
  const last = json[json.length - 1];
  if (!last) throw new Error('bcb empty');
  // BCB returns the percent (e.g. "0.053400" = 0.0534%/day). Convert to decimal.
  const cdiDaily = Number(last.valor) / 100;
  if (!Number.isFinite(cdiDaily) || cdiDaily <= 0) throw new Error('bcb bad value');
  return { fetchedAt: todayIso(), cdiDaily };
}

/**
 * Returns the latest daily CDI rate as a decimal. Cached per UTC day.
 */
export async function ensureCdi(currentCache: BcbCache | null): Promise<BcbResult> {
  const today = todayIso();
  if (currentCache && currentCache.fetchedAt === today) {
    return {
      cdiDaily: currentCache.cdiDaily,
      fetchedAt: currentCache.fetchedAt,
      stale: false,
      cache: null,
    };
  }
  try {
    const fresh = await fetchCdi();
    return { cdiDaily: fresh.cdiDaily, fetchedAt: fresh.fetchedAt, stale: false, cache: fresh };
  } catch {
    if (currentCache) {
      return {
        cdiDaily: currentCache.cdiDaily,
        fetchedAt: currentCache.fetchedAt,
        stale: true,
        cache: null,
      };
    }
    throw new Error('cdi unavailable and no cache');
  }
}

/**
 * Annualize a daily rate by compounding over 252 business days (B3
 * convention). Input/output are decimals, not percent.
 */
export function annualizeDaily(daily: number): number {
  return Math.pow(1 + daily, 252) - 1;
}
