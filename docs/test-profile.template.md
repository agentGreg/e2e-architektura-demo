# Profil projektu dla skilli sekcji (szablon)

Skopiuj do `<projekt e2e>/.claude/test-profile.md` i wypełnij. Skille zespołowe z pluginu `qa-standards` (np. `/qa-standards:analiza-buildu`) czytają ten plik zamiast mieć wpisane dane projektu; bez pliku zatrzymują się i proszą o jego utworzenie. Wypełnione przykłady: `e2e/shop/.claude/test-profile.md`, `e2e/backoffice/.claude/test-profile.md`.

```yaml
projekt: <nazwa, np. shop>
srodowisko:
  url: <adres aplikacji>
  health: <adres health-checka>
  uruchomienie: <polecenie uruchamiające testy; czy aplikacja startuje przez webServer>
raporty:
  lokalnie: <katalog raportu HTML; katalog test-results z error-context.md i trace.zip>
  z_pipelinu: <nazwa artefaktu z raportem po merge-reports; gdzie junit.xml>
  format: <json / junit / html / blob>
konta_i_role:
  - rola: <nazwa roli>
    skad: <fixture / storageState z projektu setup / konto bazowe>
dane_testowe:
  prefiks: <konwencja nazw danych tworzonych przez testy>
  bazowe: <rekordy "od zawsze", których testy nie modyfikują>
  sprzatanie: <gdzie jest teardown; jak sprawdzić, że nic nie zostało>
zasoby_wylaczne:
  - <zasób globalny i mechanizm: lock / projekt workers: 1>
konwencje:
  tagi: <lista tagów>
  nazwy_testow: <wzorzec>
  lokatory: <strategia; lista data-testid>
wlasciciele:
  test-core: <osoba>
  dane_testowe: <osoba>
  srodowisko: <zespół / osoba>
  deweloperzy: <zespół / kanał zgłoszeń>
znane_problemy:
  - <rzeczy, które mylą analizę: animacje, flagi, zależne serwisy>
```
