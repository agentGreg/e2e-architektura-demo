# Trzy warianty jednego testu (blok 1)

Ten sam scenariusz, „użytkownik loguje się i dodaje produkt do koszyka”, w trzech podejściach:

| Plik | Podejście | Co enkapsuluje |
|---|---|---|
| `cart.pom.spec.ts` | Page Object Model | ekran: `LoginPage`, `ProductsPage`, `CartPage` |
| `cart.fixtures.spec.ts` | fixtures-first | stan i język domeny: `loggedInAs`, `cart` |
| `cart.components.spec.ts` | komponenty | fragmenty ekranu: `Header`, `ProductCard`, `CartTable` |

Pytanie do każdego wariantu: co trzeba zmienić, gdy deweloperzy zmienią nagłówek, przepływ logowania albo dodadzą rolę?

Uruchomienie (projekt `examples` nie biegnie domyślnie, `default: false` w konfiguracji):

```powershell
pnpm --filter e2e-shop exec playwright test --project=examples
```

Warianty używają wspólnego konta `user`, więc biegną z `workers: 1`. Problem współdzielonych danych rozwiązuje blok 2.
