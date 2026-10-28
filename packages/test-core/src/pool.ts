// Pula gotowych zasobów (np. 4 sklepy testowe, 4 konta, 4 bazy), po jednym na worker.
// Reguła z bloku 2: zasoby tworzone na żądanie -> workerIndex; pula gotowych -> parallelIndex
// (parallelIndex jest w zakresie 0..workers-1 i wraca po restarcie workera, więc zasób nie "ucieka").
// Przypadek z sali: tryb edycji blokowany na cały sklep testowy; zamiast pliku-blokady
// każdy worker dostaje własny sklep z puli, a testów nie trzeba serializować.
export function pickFromPool<T>(pool: readonly T[], parallelIndex: number, workers: number): T {
  if (pool.length === 0) throw new Error('Pula zasobów jest pusta');
  if (workers > pool.length) {
    throw new Error(
      `Pula ma ${pool.length} zasobów, a uruchomienie używa ${workers} workerów. ` +
        `Zmniejsz --workers do ${pool.length} albo dołóż zasoby do puli.`,
    );
  }
  return pool[parallelIndex];
}
