# Ćwiczenie 1 · Karta zastrzeżeń: grasz dewelopera

Blok 1, ćwiczenie 9:41–10:06, ADR do 10:10. Pary. Ta kartka przechodzi z rąk do rąk: w rundzie 1 ma ją osoba, która nie broni podziału A, w rundzie 2 osoba, która nie broni podziału B.

**Twoja rola.** Jesteś deweloperem albo kierownikiem, który nie chce zmieniać struktury repo. Wybierz co najmniej trzy zastrzeżenia i dopytuj, aż usłyszysz liczbę albo konkretny scenariusz zmiany. Odpowiedź „łatwiej się utrzymuje” bez przykładu kwituj pytaniem „ile commitów?”. Zastrzeżenia 1–5 są ogólne, 6–9 pochodzą z opisów kodu w Waszej ankiecie (bez nazw projektów).

1. „Testy powinny być w repo aplikacji, a nie w Waszym.” (przy podziale B)
2. „Po co osobny pakiet, skoro to 200 linii?”
3. „Kto to będzie utrzymywał, jak autor odejdzie?”
4. „To spowolni nasz pipeline.” (przy podziale A)
5. „My mamy inną strukturę i nie będziemy jej zmieniać pod Was.”
6. „U Was cała logika asercji siedzi w Page Objectach. Page Object ma ponad 1100 linii. Żeby zobaczyć, co test sprawdza, trzeba otworzyć Page Object. Wspólny pakiet tylko przeniesie ten problem do wszystkich projektów.”
7. „W katalogu `pages/` macie klasy, które wołają API, np. klasę, która tworzy dokumenty przez API. Page Object miesza UI z API. Skąd mam wiedzieć, co z tego trafi do wspólnego pakietu, a co zostanie w projekcie?”
8. „Katalog `helpers/` ma około 65 plików i nie ma w nim granicy między tworzeniem danych przez API a pomocnikami do asercji. Jak wydzielicie z tego pakiet, skoro sami nie wiecie, co jest czym?”
9. „Wspólny kod i tak już mamy: logowanie, komponenty i helpery są skopiowane do każdego repo. Działa, po co paczka?” (granica `helpers/` a `utils/` oraz `pages/` a `components/` jest umowna i w każdym repo trochę inna)

Trójka: dwie osoby grają deweloperów, każda z własną kartą zastrzeżeń.

## Zapis pary (2 min, po rundzie 2)

Argumenty, które mnie przekonały (z liczbą albo scenariuszem zmiany):

1. ……………………………………………………………………………………………………

2. ……………………………………………………………………………………………………

Zastrzeżenie, na które nie było odpowiedzi (trafi do ADR jako ryzyko):

……………………………………………………………………………………………………
