# Porównanie udanej i nieudanej próby bez UI

Każdy `trace.zip` to archiwum zip z plikiem `trace.trace` (JSON, jedno zdarzenie na linię) i `trace.network`. Do porównania wystarczy lista akcji i ich wyników.

Wypisanie akcji z trace (Node, bez instalowania czegokolwiek):

```
node -e "
const fs=require('fs');const z=process.argv[1];
// Node >= 22: zipy czytamy przez npx playwright show-trace tylko w UI; tu rozpakowujemy prosto:
require('child_process').execSync(process.platform==='win32'?'tar -xf \"'+z+'\" -C trace-tmp':'unzip -o -q \"'+z+'\" -d trace-tmp');
const lines=fs.readFileSync('trace-tmp/trace.trace','utf8').split('\n').filter(Boolean).map(JSON.parse);
for(const e of lines){ if(e.type==='before') console.log('>', e.apiName, JSON.stringify(e.params).slice(0,120)); if(e.type==='after'&&e.error) console.log('  !! ', e.error.error?.message?.split('\n')[0]); }
" <ścieżka do trace.zip>
```

(Na Windows `tar -xf` rozpakowuje zip; `mkdir trace-tmp` wcześniej.)

Porównanie:
1. Wypisz akcje z trace próby udanej i nieudanej dla tego samego testu.
2. Znajdź pierwszy krok, w którym listy się rozchodzą (inny `apiName`, inny wynik, błąd).
3. Jeśli rozchodzą się na asercji wartości: sprawdź w `error-context.md` nieudanej próby, czy strona zawiera dane spoza prefiksu projektu (kolizja) albo wartość policzoną źle (bug).
4. Jeśli rozchodzą się na `goto`/pierwszym żądaniu: środowisko albo uprawnienia (kod odpowiedzi w `trace.network`).
5. Jeśli listy są identyczne, a różni się tylko czas: flaky (timing).

`error-context.md` leży obok `trace.zip` w katalogu testu (`test-results/<nazwa>/`) i jest snapshotem dostępności strony w chwili błędu; to najtańszy dowód, czytaj go pierwszy.
