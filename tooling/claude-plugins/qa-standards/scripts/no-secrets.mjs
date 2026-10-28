// Hook PreToolUse z pluginu qa-standards: szuka wzorców tokenów w treści zapisywanej
// do tooling/claude-plugins/**. Exit 2 blokuje zapis i zwraca powód modelowi.
const chunks = [];
for await (const c of process.stdin) chunks.push(c);
let input;
try {
  input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
} catch {
  process.exit(0);
}
const file = String(input?.tool_input?.file_path ?? '').split('\\').join('/');
if (!file.includes('/tooling/claude-plugins/')) process.exit(0);

const text = [input?.tool_input?.content, input?.tool_input?.new_string].filter(Boolean).join('\n');
const patterns = [
  /sk-[A-Za-z0-9_-]{20,}/, // klucze API w stylu OpenAI/Anthropic
  /ghp_[A-Za-z0-9]{30,}/, // GitHub PAT
  /AKIA[0-9A-Z]{16}/, // AWS access key
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /(password|haslo|token)\s*[:=]\s*['"][^'"]{8,}['"]/i,
];
const hit = patterns.find((p) => p.test(text));
if (hit) {
  console.error(`Zablokowano zapis do ${file}: treść wygląda na sekret (${hit}). Pluginy w marketplace są publiczne dla sekcji; sekrety trzymamy w zmiennych środowiskowych.`);
  process.exit(2);
}
process.exit(0);
