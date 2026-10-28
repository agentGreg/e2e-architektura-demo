// Identyfikator uruchomienia: na CI numer buildu, lokalnie znacznik czasu.
// Wołany w playwright.config.ts (proces główny), żeby KAŻDY worker dostał tę samą wartość
// przez process.env; gdyby każdy worker liczył Date.now() sam, miałby inny runId.
export function ensureRunId(): string {
  process.env.E2E_RUN_ID ??= process.env.BUILD_BUILDID ?? process.env.GITHUB_RUN_ID ?? String(Date.now());
  return process.env.E2E_RUN_ID;
}

export function runId(): string {
  const id = process.env.E2E_RUN_ID;
  if (!id) throw new Error('Brak E2E_RUN_ID: wywołaj ensureRunId() w playwright.config.ts');
  return id;
}

/**
 * Prefiks danych tworzonych przez jeden worker: e2e_<run>_s<shard>_w<workerIndex>_
 * Numer sharda jest potrzebny, bo na CI wszystkie shardy mają ten sam runId (numer buildu),
 * a każdy ma własnego workera o indeksie 0.
 */
export function workerPrefix(workerIndex: number, shard: number | undefined): string {
  return `e2e_${runId()}_s${shard ?? 0}_w${workerIndex}_`;
}
