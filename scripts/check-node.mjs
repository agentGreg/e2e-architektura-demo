// Sprawdza wersję Node przed instalacją i testami. Repo wymaga Node >= 22.13,
// bo używa wbudowanego modułu `node:sqlite` (bez flagi od 22.13). Opcji `timeout`
// konstruktora (dostępnej od 22.16) nie używamy: busy timeout ustawiamy przez PRAGMA.
const REQUIRED = [22, 13];
const [major, minor] = process.versions.node.split('.').map(Number);
const ok = major > REQUIRED[0] || (major === REQUIRED[0] && minor >= REQUIRED[1]);

if (!ok) {
  console.error(
    `\nZa stara wersja Node: ${process.versions.node}. Repo wymaga Node >= ${REQUIRED.join('.')} ` +
      `(wbudowany modul node:sqlite).\n` +
      `Zainstaluj Node 24 LTS (https://nodejs.org) albo uzyj przenosnego Node z paczki offline ` +
      `(README, sekcja "Paczka offline").\n`,
  );
  process.exit(1);
}
if (major === 20) process.exit(1);
