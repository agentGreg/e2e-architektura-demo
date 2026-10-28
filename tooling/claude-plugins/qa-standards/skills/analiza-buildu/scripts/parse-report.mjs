// Czyta raport Playwright (results.json z reportera `json`, albo junit.xml) i wypisuje
// porażki w jednym zwięzłym Markdownie: test, projekt, status, pierwsza linia błędu, trace,
// error-context, plus porównanie z próbą udaną, jeśli obok leży katalog `ok/`.
// Skill wykonuje ten skrypt zamiast czytać surowy JSON (oszczędza kontekst). Działa też bez Claude.
//
// Użycie: node parse-report.mjs <katalog z results.json lub junit.xml> [--ok <katalog próby udanej>]
// Blob (blob-report/*.zip): najpierw `npx playwright merge-reports --reporter json ./blob-report > results.json`.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const dir = path.resolve(args[0] ?? '.');
const okArg = args.indexOf('--ok');
const okDir = okArg >= 0 ? path.resolve(args[okArg + 1]) : path.join(path.dirname(dir), 'ok');

const stripAnsi = (s) => String(s ?? '').replace(/\u001b\[[0-9;]*m/g, '');
const firstLine = (s) => stripAnsi(s).split('\n').map((l) => l.trim()).find(Boolean) ?? '';

function loadJson(file) {
  const report = JSON.parse(fs.readFileSync(file, 'utf8'));
  const tests = [];
  const walk = (suite, trail) => {
    const here = suite.title ? [...trail, suite.title] : trail;
    for (const s of suite.suites ?? []) walk(s, here);
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests) {
        const last = t.results[t.results.length - 1] ?? {};
        tests.push({
          id: `${t.projectName} › ${[...here.slice(1), spec.title].join(' › ')}`,
          file: spec.file,
          line: spec.line,
          project: t.projectName,
          outcome: t.status, // expected | unexpected | flaky | skipped
          attempts: t.results.map((r) => r.status),
          error: firstLine(last.error?.message ?? last.errors?.[0]?.message),
          errorDetail: stripAnsi(last.error?.message ?? '').split('\n').slice(0, 12).join('\n'),
          duration: last.duration,
          attachments: (last.attachments ?? []).filter((a) => a.path).map((a) => `${a.name}: ${a.path}`),
        });
      }
    }
  };
  walk(report, []);
  return { tests, stats: report.stats };
}

function loadJunit(file) {
  const xml = fs.readFileSync(file, 'utf8');
  const tests = [];
  const re = /<testcase\b([^>]*)>([\s\S]*?)<\/testcase>|<testcase\b([^>]*)\/>/g;
  let m;
  while ((m = re.exec(xml))) {
    const attrs = m[1] ?? m[3] ?? '';
    const body = m[2] ?? '';
    const name = /name="([^"]*)"/.exec(attrs)?.[1] ?? '?';
    const classname = /classname="([^"]*)"/.exec(attrs)?.[1] ?? '';
    const failure = /<failure[^>]*message="([^"]*)"/.exec(body)?.[1];
    const skipped = /<skipped/.test(body);
    tests.push({
      id: `${classname} › ${name}`.replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      project: '',
      outcome: failure ? 'unexpected' : skipped ? 'skipped' : 'expected',
      attempts: [failure ? 'failed' : 'passed'],
      error: failure ? firstLine(failure.replace(/&quot;/g, '"').replace(/&#10;/g, '\n')) : '',
      errorDetail: '',
      attachments: [],
    });
  }
  return { tests, stats: null, note: 'JUnit: test flaky wygląda jak passed (bez PLAYWRIGHT_JUNIT_INCLUDE_RETRIES=1).' };
}

function load(d) {
  const json = path.join(d, 'results.json');
  const junit = path.join(d, 'junit.xml');
  if (fs.existsSync(json)) return loadJson(json);
  if (fs.existsSync(junit)) return loadJunit(junit);
  const blob = fs.existsSync(path.join(d, 'blob-report')) || fs.readdirSync(d).some((f) => f.endsWith('.zip'));
  throw new Error(
    `Brak results.json ani junit.xml w ${d}.` + (blob ? ' Są bloby: npx playwright merge-reports --reporter json <katalog> > results.json' : ''),
  );
}

const run = load(dir);
const ok = fs.existsSync(okDir) && okDir !== dir ? load(okDir) : null;
const okById = new Map((ok?.tests ?? []).map((t) => [t.id, t]));

const bad = run.tests.filter((t) => t.outcome === 'unexpected' || t.outcome === 'flaky');
const counts = run.tests.reduce((acc, t) => ((acc[t.outcome] = (acc[t.outcome] ?? 0) + 1), acc), {});

console.log(`# Raport: ${dir}\n`);
console.log(`Testy: ${run.tests.length}; ` + Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ') + (run.note ? `\n\n${run.note}` : ''));
if (ok) console.log(`Próba udana do porównania: ${okDir} (${ok.tests.length} testów)`);
console.log('\n## Porażki\n');
if (bad.length === 0) console.log('Brak porażek.');

// Grupujemy powtórzenia tego samego testu (repeat-each), żeby skill widział "ile razy padł".
const groups = new Map();
for (const t of bad) {
  const g = groups.get(t.id) ?? { ...t, runs: 0, errors: new Set(), attachments: new Set() };
  g.runs += 1;
  if (t.error) g.errors.add(t.error);
  for (const a of t.attachments) g.attachments.add(a);
  groups.set(t.id, g);
}
const totalById = run.tests.reduce((acc, t) => ((acc[t.id] = (acc[t.id] ?? 0) + 1), acc), {});

for (const g of groups.values()) {
  const inOk = okById.get(g.id);
  console.log(`### ${g.id}`);
  console.log(`- plik: ${g.file ?? '?'}:${g.line ?? '?'}`);
  console.log(`- wynik: ${g.outcome}, padł ${g.runs} z ${totalById[g.id]} uruchomień; próby: ${g.attempts.join(', ')}`);
  if (inOk) console.log(`- w próbie udanej: ${inOk.outcome} (${inOk.attempts.join(', ')})`);
  else if (ok) console.log('- w próbie udanej: brak tego testu');
  for (const e of g.errors) console.log(`- błąd: ${e}`);
  if (g.errorDetail) console.log('```\n' + g.errorDetail + '\n```');
  for (const a of g.attachments) console.log(`- ${a}`);
  console.log('');
}
