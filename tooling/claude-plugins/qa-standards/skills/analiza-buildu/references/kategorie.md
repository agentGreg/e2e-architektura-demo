# Kategorie porażek E2E

Kolejność = priorytet przy niejednoznaczności (wyżej wygrywa).

| Kategoria | Sygnały w raporcie | Jak potwierdzić | Działanie | Typowy właściciel |
|---|---|---|---|---|
| **środowisko** | `ECONNREFUSED`, `net::ERR_CONNECTION_REFUSED`, timeout na `/health` albo pierwszym `goto`, 502/504, DNS, certyfikat | pada każdy test tego środowiska; `webServer` w konfiguracji nie wystartował; adres z profilu nie odpowiada | zgłoszenie do DevOpsów / poprawa `webServer`; build do powtórzenia po naprawie | DevOps / właściciel środowiska |
| **uprawnienia** | 401, 403, „Brak uprawnień”, przekierowanie na logowanie w środku testu, brak elementu widocznego tylko dla roli | test używa roli innej niż wymaga scenariusz (porównaj z rolami z profilu); konto wygasło; storageState z innego środowiska | poprawna rola przez `storageState` z projektu `setup`; odnowienie konta | autor testu / właściciel kont testowych |
| **uszkodzone dane** | wartości wyjściowe inne niż seed (stan magazynowy ≠ oczekiwany już na początku testu), rekord „od zawsze” zmieniony, brak rekordu bazowego | porażka także na 1 workerze; stan bazy przed testem odbiega od profilu | odtworzenie danych bazowych; seed idempotentny; test nie zakłada stanu rekordów współdzielonych | właściciel danych testowych |
| **kolizja danych** | `toHaveText`/`toHaveCount` o 1–2 od oczekiwanego, „już anulowane”, „nie znaleziono”, koszyk pusty mimo dodania; test zielony na 1 workerze, czerwony na N | ten sam test w próbie udanej przeszedł; dane w teście mają nazwy spoza prefiksu per worker (profil: konwencja prefiksu); `afterEach` czyści dane wspólne | dane per worker (fixture z prefiksem), `lock` dla zasobu wyłącznego, osobny projekt `workers: 1` dla długich | autor testu / właściciel `test-core` |
| **flaky** | `waitForTimeout`, asercje z krótkim `timeout`, `toBeHidden` po stałym czasie, timing animacji; wynik `flaky` w raporcie (przeszedł po retry) | `--repeat-each=10` daje mieszane wyniki na 1 workerze; retry `isolated` przechodzi | asercja z auto-wait zamiast czekania; `@quarantine` z właścicielem i terminem; wyjście = 10 zielonych | autor testu |
| **bug** | ta sama porażka w każdej próbie, także na 1 workerze i po retry; wartość policzona źle przez aplikację; błąd 500 | reprodukcja ręczna na adresie z profilu; porównanie trace: ten sam krok daje inny wynik niż w poprzednim zielonym buildzie | zgłoszenie do deweloperów z trace i krokami; test zostaje czerwony (nie do kwarantanny) | deweloperzy aplikacji |

Pułapki:
- Kolizja danych udająca flaky: przechodzi po retry, bo retry trafiło na pusty moment. Sprawdź nazwy danych i liczbę workerów, nie tylko wynik retry.
- Bug udający kolizję: wartość „o 1 inna” może być błędem w aplikacji. Rozstrzyga próba na 1 workerze.
- Środowisko udające wszystko: jeden niewystartowany serwis daje dziesiątki różnych komunikatów. Zacznij od pierwszego błędu w czasie.
