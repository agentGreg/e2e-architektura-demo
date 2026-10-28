# Profil projektu dla skilli sekcji (szablon)

Skopiuj do `<projekt e2e>/.claude/test-profile.md` i wypełnij. Skill zespołowy (`/qa-standards:e2e-test`) czyta ten plik zamiast mieć wpisane dane projektu; bez pliku zatrzymuje się i prosi o jego utworzenie.

```yaml
projekt: <nazwa, np. shop>
aplikacja_url: <http://localhost:4100>
uruchomienie_testow: <pnpm --filter e2e-shop exec playwright test>
katalog_testow: <tests/>
fixtures: <ścieżka do pliku z test/expect, np. ./fixtures.ts lub @demo/test-core>
role:
  - nazwa: <user>
    fixture_lub_storage_state: <storageState z projektu setup / fixture workerStorageState>
  - nazwa: <admin>
    fixture_lub_storage_state: <.auth/admin.json>
dane_testowe:
  tworzenie: <fixture `product`, `order` z @demo/test-core; API: ShopApi.upsertProduct>
  prefiks: <e2e_<runId>_w<workerIndex>_>
lokatory:
  strategia: <getByRole/getByLabel, data-testid: product-row, cart-count, order-status>
  uwagi: <dynamiczne ID w ... ; do negocjacji z deweloperami data-testid dla ...>
konwencja_nazw: <plik <ekran>.spec.ts, describe po ekranie, test "<aktor> <czynność> <efekt>">
tagi: <@shop @smoke @exclusive @quarantine>
zasoby_wylaczne: <tryb konserwacji: lock 'maintenance'>
```
