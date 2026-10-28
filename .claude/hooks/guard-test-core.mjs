// Hook PreToolUse (Edit|Write): blokuje zapis do packages/test-core/** bez zmiennej ALLOW_CORE_EDIT.
// Demo z bloku 3: "ma być wymuszone niezależnie od modelu" -> hook, nie zdanie w CLAUDE.md.
// Node zamiast bash, żeby działał tak samo na Windows (Git Bash lub PowerShell) i macOS.
// Wejście: JSON na stdin z tool_input.file_path; exit 2 blokuje narzędzie i zwraca stderr modelowi.
import path from 'node:path';

const chunks = [];
for await (const c of process.stdin) chunks.push(c);
let input;
try {
  input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
} catch {
  process.exit(0); // nie blokujemy, gdy nie rozumiemy wejścia
}

const file = input?.tool_input?.file_path;
if (!file) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
// Ścieżki z Windows przychodzą z backslashami; normalizujemy do '/'.
const rel = path.relative(projectDir, path.resolve(file)).split(path.sep).join('/');
const guarded = rel.startsWith('packages/test-core/');

if (guarded && !process.env.ALLOW_CORE_EDIT) {
  console.error(
    `Zablokowano zapis do ${rel}: packages/test-core to warstwa wspólna dla wszystkich projektów e2e. ` +
      `Zmiany wymagają review właściciela pakietu. Jeśli to zamierzona zmiana, uruchom Claude Code z ALLOW_CORE_EDIT=1.`,
  );
  process.exit(2);
}
process.exit(0);
