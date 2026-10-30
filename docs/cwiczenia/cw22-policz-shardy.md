# Blok 2.2. Policz shardy

Sharding, 11:55–12:15. Arkusz na ok. 10 minut, w parach, po demo `--shard`, blob i `merge-reports`.

## Cel

Liczysz, ile shardów i workerów potrzeba, żeby pipeline trwający 150–180 minut zmieścił się w czasie, który akceptuje zespół. Wynikiem jest metoda i lista danych, o które trzeba zapytać DevOpsów.

## Dane i brakujące dane

Dane z ankiety (jedyne, które mamy):

| Projekt | Liczba testów | Czas pipeline’u |
|---|---|---|
| P1 | 670 | 180 min |
| P2 | 1000 | 150 min |

Tych danych brakuje i bez nich wynik jest szacunkiem:

| Brakujące dane | P1 | P2 |
|---|---|---|
| Ile z czasu pipeline’u to same testy (bez instalacji, budowania, publikacji)? `T_testy` | | |
| Ile workerów biegnie dziś na agencie? `W_dziś` | | |
| Ile rdzeni ma agent? (`workers` ≈ rdzenie albo `'50%'`) | | |
| Czy jest `fullyParallel: true`? Jeśli nie: ile trwa najdłuższy plik? | | |
| Ile zadań może biec równocześnie w ADO (agenci, równoległe joby)? `J_max` | | |
| Ile trwa narzut jednego zadania (instalacja, przeglądarki, start aplikacji)? `T_narzut` | | |
| Docelowy czas pipeline’u, który akceptuje zespół? `T_cel` | | |

### Metoda

1. Czas pracy testów w „minutach workera”: `M = T_testy × W_dziś`.
2. Czas jednego testu średnio: `M / liczba testów`. Przydaje się w rozmowie z zespołem. Do planowania jest za mało dokładna, bo czasy testów bywają bardzo nierówne.
3. Na jedno zadanie zostaje `T_cel − T_narzut` minut na testy.
4. Potrzebna liczba „slotów” (shard × worker): `S = M / (T_cel − T_narzut)`, w górę.
5. Shardy: `N = S / W_agent`, w górę, gdzie `W_agent` to workery na jednym agencie.
6. Sprawdzenia:
   - `N ≤ J_max`. Jeśli nie, część shardów czeka w kolejce i pipeline się wydłuża.
   - Bez `fullyParallel` żaden shard nie skończy się szybciej niż najdłuższy plik.
   - Przy zasobie wyłącznym liczba slotów nie może przekroczyć liczby zasobów w puli. Testy z `lock` i projekt `workers: 1` liczysz osobno, sekwencyjnie.
   - Koszt: łączny czas agentów rośnie o `N × T_narzut`.

### Przykład z założeniami (do poprawienia na prawdziwych liczbach)

Założenia, których nie znamy: cały czas pipeline’u to testy, dziś biegnie 1 worker, narzut zadania 5 min, cel 30 min, 4 workery na agencie.

| | P1 | P2 |
|---|---|---|
| `M` | 180 × 1 = 180 min | 150 × 1 = 150 min |
| średnio na test | 180 / 670 ≈ 0,27 min ≈ 16 s | 150 / 1000 = 0,15 min = 9 s |
| na testy w zadaniu | 30 − 5 = 25 min | 25 min |
| `S` | 180 / 25 = 7,2 → 8 slotów | 150 / 25 = 6 slotów |
| `N` przy 4 workerach | 8 / 4 = 2 shardy | 6 / 4 = 1,5 → 2 shardy |

Jeśli dziś biegną już 4 workery, `M` jest cztery razy większe i wynik też. Dlatego najpierw ustal, ile workerów biegnie dziś w pipeline’ie.

### Wynik dla Twojego projektu

| | Wartość |
|---|---|
| `M` | |
| `T_cel − T_narzut` | |
| `S` | |
| `W_agent` | |
| `N` | |
| `N ≤ J_max` (tak / nie) | |
| Testy wyłączone z macierzy (`lock`, `workers: 1`) i ich czas | |

## Kryterium „gotowe”

Para ma wynik `N` dla jednego projektu albo listę brakujących danych, bez których go nie policzy.

## Artefakt do zabrania

Liczba shardów i workerów dla Twojego projektu albo lista brakujących danych. Obie rzeczy trafiają na kartę wymagań dla pipeline’u (blok 2.3).
