// Uruchamia obie aplikacje demo w jednym terminalu (Ctrl+C zamyka obie).
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const apps = [
  ['shop', path.join(root, 'apps', 'shop', 'src', 'server.mjs')],
  ['backoffice', path.join(root, 'apps', 'backoffice', 'src', 'server.mjs')],
];
const children = apps.map(([name, file]) => {
  const child = spawn(process.execPath, [file], { stdio: 'inherit', env: process.env });
  child.on('exit', (code) => console.log(`[${name}] zakończony (${code})`));
  return child;
});
const stop = () => {
  for (const c of children) c.kill();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
