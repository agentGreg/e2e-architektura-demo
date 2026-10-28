# Checklista testu E2E (wersja 0.3.0)

Obowiązkowe elementy każdego pliku `.spec.ts` w projektach sekcji.

1. **Tag.** Każdy test ma co najmniej jeden tag (`{ tag: '@smoke' }`, `@shop`, `@backoffice`, `@exclusive`, `@quarantine`). Test w kwarantannie ma adnotację `owner` z osobą i terminem.
2. **Logowanie przez fixture.** Test nie wypełnia formularza logowania. Rola przychodzi z `storageState` (projekt `setup` albo fixture workera). Formularz logowania wolno wypełniać tylko w testach logowania.
3. **Brak literałów danych.** W pliku testu nie ma nazwy produktu, numeru zamówienia, loginu ani SQL. Dane tworzy fixture (`product`, `order`) z prefiksem uruchomienia.
4. **Ścieżka negatywna.** Jeśli scenariusz ma wariant odmowy (brak uprawnień, błędne dane, brak towaru), plik zawiera test na ten wariant.
5. **Lokatory.** `getByRole`, `getByLabel`, `getByText`, `getByTestId`. Bez CSS po klasach, bez XPath, bez `nth()` bez uzasadnienia w komentarzu.
6. **Sprzątanie w fixture.** Żadnego `afterEach` z czyszczeniem danych w pliku testu; sprzątanie jest w teardown fixture.
7. **Zasoby wyłączne.** Test zmieniający ustawienie globalne ma `lock` z nazwą zasobu albo tag `@exclusive` (projekt `serial-resources`).
8. **Profil projektu.** Projekt e2e ma `.claude/test-profile.md` (szablon `docs/test-profile.template.md`); dane z pliku testu (role, prefiks, zasoby wyłączne) zgadzają się z profilem.
9. **Bez stałego czekania.** Żadnego `waitForTimeout` w teście; czas obsługują asercje z auto-wait. Wyjątek wymaga komentarza z przyczyną.
