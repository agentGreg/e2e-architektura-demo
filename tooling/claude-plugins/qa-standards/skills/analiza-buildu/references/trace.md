# Porównanie udanej i nieudanej próby bez UI

Każdy `trace.zip` (Playwright 1.64) to archiwum zip. Do porównania prób wystarczą dwa rodzaje plików:

- `test.trace`: kroki testu w kolejności (JSON, jedno zdarzenie na linię). Zdarzenie `before` ma `title` (np. `Navigate`, `Click`, `Expect "toHaveText"`) i `params` (adres, lokator, wartość oczekiwana); `after` z polem `error` niesie błąd kroku w `error.message`.
- `<n>-trace.trace` i `<n>-trace.network` (np. `0-…` dla samego `request`, `1-…` dla przeglądarki): zdarzenia przeglądarki i ruch sieciowy; w `.network` każde żądanie to `resource-snapshot` z `snapshot.request.url` i `snapshot.response.status`.

Wypisanie kroków, błędów i odpowiedzi HTTP ≥ 400 z jednego trace (Node, bez instalowania czegokolwiek; działa w PowerShell, Git Bash i bash; rozpakowuje do katalogu tymczasowego: `tar.exe` z systemu na Windows i macOS, `unzip` na Linuksie):

```
node -e "const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');const z=path.resolve(process.argv[1]);const d=fs.mkdtempSync(path.join(os.tmpdir(),'trace-'));if(process.platform==='linux')cp.execFileSync('unzip',['-q','-o',z,'-d',d]);else cp.execFileSync(process.platform==='win32'?path.join(process.env.SystemRoot,'System32','tar.exe'):'tar',['-xf',z,'-C',d]);const read=f=>fs.readFileSync(path.join(d,f),'utf8').split('\n').filter(Boolean).map(l=>JSON.parse(l));const strip=s=>String(s||'').replace(/\u001b\[[0-9;]*m/g,'');for(const e of read('test.trace')){const p=JSON.stringify(e.params||{});if(e.type==='before'&&e.method!=='hook'&&e.method!=='fixture')console.log('>',e.title,p==='{}'?'':p.slice(0,120));if(e.type==='after'&&e.error){const m=strip(e.error.message).split('\n');for(const l of [m[0],...m.filter(l=>/^(Expected|Received)/.test(l))])console.log('  ERR',l);}}for(const f of fs.readdirSync(d).filter(f=>f.endsWith('-trace.network')))for(const e of read(f)){const r=e.snapshot;if(r&&r.response&&r.response.status>=400)console.log('  HTTP',r.response.status,r.request.method,r.request.url);}fs.rmSync(d,{recursive:true,force:true});" <ścieżka do trace.zip>
```

Przykład (sklep, `bug.spec.ts` w próbie nieudanej):

```
> Navigate {"url":"/cart"}
> Expect "toHaveText" {"locator":"getByTestId('cart-total')","expected":"14,97 zł"}
  ERR Error: expect(locator).toHaveText(expected) failed
  ERR Expected: "14,97 zł"
  ERR Received: "4,99 zł"
```

Porównanie:
1. Wypisz kroki z trace próby udanej i nieudanej dla tego samego testu.
2. Znajdź pierwszy krok, w którym listy się rozchodzą (inny krok, inne `params`, linia `ERR`).
3. Jeśli rozchodzą się na asercji wartości: sprawdź w `error-context.md` nieudanej próby, czy strona zawiera dane spoza prefiksu projektu (kolizja) albo wartość policzoną źle (bug).
4. Jeśli rozchodzą się na `Navigate`/pierwszym żądaniu: środowisko (`ECONNREFUSED` w linii `ERR`) albo uprawnienia (linia `HTTP 401/403`).
5. Jeśli listy są identyczne, a różni się tylko czas: flaky (timing).

`error-context.md` leży obok `trace.zip` w katalogu testu (`test-results/<nazwa>/`, przy retry `<nazwa>-retry1/`) i jest snapshotem dostępności strony w chwili błędu; to najtańszy dowód, czytaj go pierwszy.
