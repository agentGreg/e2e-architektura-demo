// Usuwa plik bazy (wraz z -wal/-shm) i tworzy go od nowa z danymi bazowymi.
// Uruchamiaj przy zatrzymanych aplikacjach.
import fs from 'node:fs';
import { dbPath, openDb, ensureSchema } from '@demo/app-kit/db';

const file = dbPath();
for (const suffix of ['', '-wal', '-shm']) fs.rmSync(file + suffix, { force: true });
const db = openDb(file);
ensureSchema(db);
db.close();
console.log(`Baza odtworzona: ${file}`);
