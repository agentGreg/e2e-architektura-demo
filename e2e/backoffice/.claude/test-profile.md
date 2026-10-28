# Profil projektu: e2e/backoffice

```yaml
projekt: backoffice
srodowisko:
  url: http://localhost:4200
  health: http://localhost:4200/health
  zaleznosci: sklep http://localhost:4100 (tryb konserwacji i zamówienia); obie aplikacje startują przez webServer
  uruchomienie: pnpm --filter e2e-backoffice exec playwright test
raporty:
  lokalnie: e2e/backoffice/playwright-report, e2e/backoffice/test-results/<test>/{error-context.md,trace.zip}
  z_pipelinu: artefakt playwright-report po merge-reports (html + junit.xml)
  format: list + html lokalnie; na CI blob -> merge-reports
konta_i_role:
  - rola: operator (= rola admin w bazie)
    skad: konto bazowe `admin`, storageState z projektu setup (e2e/backoffice/.auth/operator.json); każda `page` jest operatorem
  - rola: user (klient sklepu)
    skad: użytkownik per worker z fixture `workerUser` (tylko przez API `shopApi`, nie w przeglądarce)
dane_testowe:
  prefiks: e2e_<runId>_s<shard>_w<workerIndex>_ (zamówienia: <prefiks>ORD-<id produktu>)
  bazowe: konta user/admin, produkty bazowe; nie modyfikować
  sprzatanie: zamówienia znikają kaskadowo z produktem i użytkownikiem workera; kontrola `pnpm seed:check`
zasoby_wylaczne:
  - tryb konserwacji sklepu: `lock: 'maintenance'` (tests/maintenance.spec.ts) oraz @exclusive w projekcie serial-resources (maintenance-flow.spec.ts); fixture `maintenance` przywraca stan wyłączony
konwencje:
  tagi: "@backoffice @exclusive @quarantine"
  nazwy_testow: "<aktor> <czynność> <efekt>", operator jako aktor
  lokatory: getByRole/getByLabel; data-testid: order-row, order-number, order-status, maintenance-state, flash, current-user
wlasciciele:
  test-core: właściciel packages/test-core
  dane_testowe: właściciel seedu w test-core
  srodowisko: DevOps
  deweloperzy: zespół backoffice
znane_problemy:
  - lista zamówień pokazuje 200 ostatnich; filtruj po numerze (`?q=`), nie licz wierszy globalnie
```
