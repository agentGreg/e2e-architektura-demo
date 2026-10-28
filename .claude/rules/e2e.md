---
paths:
  - "e2e/**/*.ts"
---

# Reguły dla plików testów (e2e/**)

Ładowane tylko przy pracy z plikami pasującymi do `paths`, więc nie zajmują kontekstu przy innych zadaniach.

- Import `test`/`expect` z `@demo/test-core` (albo z lokalnego `fixtures.ts`, który go rozszerza), nie z `@playwright/test`.
- Lokatory: `getByRole`, `getByLabel`, `getByTestId`; bez CSS po klasach i bez XPath.
- Żadnych literałów danych (nazwa produktu, numer zamówienia, login) w pliku `.spec.ts`: dane przychodzą z fixture.
- Żadnego SQL w testach; dostęp do bazy tylko przez `packages/test-core`.
- Test ma tag i ścieżkę negatywną, gdy scenariusz ją ma (np. brak uprawnień).
- Test w kwarantannie: tag `@quarantine` + właściciel i termin w adnotacji `{ annotation: { type: 'owner', description: '...' } }`.
