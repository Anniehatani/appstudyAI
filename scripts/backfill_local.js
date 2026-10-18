import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sqlite') && !f.startsWith('metadata'));

if (files.length > 0) {
  const dbPath = path.join(dir, files[0]);
  const db = new DatabaseSync(dbPath);
  db.exec("UPDATE profiles SET created_at = '2026-10-12 00:00:00' WHERE created_at IS NULL;");
  db.exec("UPDATE accounts SET created_at = '2026-10-12 00:00:00' WHERE created_at IS NULL;");
  console.log('Updated local sqlite created_at for existing users');
  db.close();
}
