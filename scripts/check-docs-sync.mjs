// Strażnik spójności dokumentacji między gałęziami: `docs/` i `README.md` na każdej
// gałęzi `solution/*` mają być takie same jak na `main`. Różnice wolno mieć tylko
// w plikach z listy DOZWOLONE (pliki rozwiązania). Kod zwrotu 1 przy innej różnicy.
//
// Użycie: pnpm docs:check            (gałęzie lokalne: main i solution/*)
//         pnpm docs:check -- --remote (origin/main i origin/solution/*; najpierw git fetch)
import { spawnSync } from 'node:child_process';

const SCIEZKI = ['docs', 'README.md'];

// Pliki, które celowo różnią się od main na danej gałęzi (ścieżka względem katalogu repo).
const DOZWOLONE = {
  'solution/1': ['docs/adr/0002-pierwszy-wspolny-pakiet-test-core.md'],
  'solution/2a': [],
  'solution/3a': [],
  'solution/3b': [],
};

const remote = process.argv.includes('--remote');
const pre = remote ? 'origin/' : '';

function git(args) {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr.trim()}`);
  return r.stdout;
}

const pattern = remote ? 'refs/remotes/origin/solution/*' : 'refs/heads/solution/*';
const galezie = git(['for-each-ref', '--format=%(refname:short)', pattern])
  .split('\n')
  .filter(Boolean)
  .map((r) => r.replace(/^origin\//, ''));

let bledy = 0;
for (const g of Object.keys(DOZWOLONE)) {
  if (!galezie.includes(g)) {
    console.log(`BRAK  ${pre}${g} (gałąź z listy DOZWOLONE nie istnieje)`);
    bledy++;
  }
}
for (const g of galezie) {
  if (!(g in DOZWOLONE)) {
    console.log(`NOWA  ${pre}${g}: dopisz ją do DOZWOLONE w scripts/check-docs-sync.mjs`);
    bledy++;
    continue;
  }
  const zmiany = git(['diff', '--name-status', `${pre}main`, `${pre}${g}`, '--', ...SCIEZKI])
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('\t'));
  const niedozwolone = zmiany.filter(([, plik]) => !DOZWOLONE[g].includes(plik));
  if (niedozwolone.length) {
    bledy++;
    console.log(`RÓŻNE ${pre}${g} względem ${pre}main:`);
    for (const [status, plik] of niedozwolone) console.log(`  ${status}\t${plik}`);
  } else {
    const dozw = zmiany.length ? ` (dozwolone: ${zmiany.map(([s, p]) => `${s} ${p}`).join(', ')})` : '';
    console.log(`OK    ${pre}${g}${dozw}`);
  }
}

if (bledy) {
  console.log(`\nDokumentacja rozjechana. Przenieś zmiany z main: git restore --source=main -- docs README.md (na gałęzi solution/*), potem przywróć pliki z listy DOZWOLONE.`);
  process.exit(1);
}
console.log('\nOK: docs/ i README.md zgodne z main na wszystkich gałęziach solution/*.');
