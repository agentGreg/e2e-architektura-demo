# Profil projektu: e2e/shop

```yaml
projekt: shop
srodowisko:
  url: http://localhost:4100
  health: http://localhost:4100/health
  uruchomienie: pnpm --filter e2e-shop exec playwright test   # aplikacja apps/shop startuje przez webServer
raporty:
  lokalnie: e2e/shop/playwright-report, e2e/shop/test-results/<test>/{error-context.md,trace.zip}
  z_generatora: e2e/shop/demo-runs/{ok,failed}/ (results.json, junit.xml, playwright-report, test-results z trace)
  z_pipelinu: artefakt playwright-report po merge-reports (html + junit.xml)
  format: json + junit + html; na CI blob -> merge-reports
konta_i_role:
  - rola: user
    skad: użytkownik per worker z fixture `workerUser` (e2e_<run>_s<shard>_w<n>_user); `page` ma jego storageState domyślnie
  - rola: admin
    skad: konto bazowe `admin`, storageState z projektu setup (e2e/shop/.auth/admin.json), `test.use({ storageState: ADMIN_STATE })`
dane_testowe:
  prefiks: e2e_<runId>_s<shard>_w<workerIndex>_
  bazowe: produkty Szampon, Mydło, Pasta do zębów (stan 10), konta user/user123 i admin/admin123; testy w `tests/` ich nie modyfikują
  sprzatanie: teardown fixture (`product`, `products`, `workerUser`) po prefiksie; kontrola `pnpm seed:check`
  uwaga: projekt `demo-failures` celowo używa wspólnego konta `user` i produktów bazowych (materiał szkoleniowy)
zasoby_wylaczne:
  - tryb konserwacji sklepu (ustawiany z backoffice): lock 'maintenance' albo @exclusive
konwencje:
  tagi: "@shop @smoke @exclusive @quarantine @demo"
  nazwy_testow: "<aktor> <czynność> <efekt>", describe po ekranie (koszyk, panel admina, zamówienia klienta)
  lokatory: getByRole/getByLabel; data-testid: product-row, product-name, product-stock, cart-count, cart-item-name, cart-total, order-row, order-status, flash, current-user
wlasciciele:
  test-core: właściciel packages/test-core (review każdej zmiany)
  dane_testowe: właściciel seedu w test-core
  srodowisko: DevOps (pipeline), lokalnie autor testu
  deweloperzy: zespół sklepu; zgłoszenie z trace.zip i krokami
znane_problemy:
  - komunikat flash znika po losowych 1–2 s; asercje na nim tylko z auto-wait, bez waitForTimeout
  - SHOP_BUG_TOTAL=1 włącza celowy błąd sumy koszyka (generator demo-runs/failed)
  - BACKOFFICE_URL (port 4200) nie startuje z konfiguracji e2e/shop
```
