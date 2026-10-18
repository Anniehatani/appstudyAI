import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sqlite') && !f.startsWith('metadata'));
console.log('Files:', files);

if (files.length > 0) {
  const dbPath = path.join(dir, files[0]);
  const db = new DatabaseSync(dbPath);
  try { db.exec('ALTER TABLE profiles ADD COLUMN created_at TEXT;'); console.log('Added created_at to profiles'); } catch(e) { console.log(e.message); }
  try { db.exec('ALTER TABLE accounts ADD COLUMN created_at TEXT;'); console.log('Added created_at to accounts'); } catch(e) { console.log(e.message); }
  try { db.exec('ALTER TABLE profiles ADD COLUMN school TEXT;'); } catch(e) {}
  try { db.exec('ALTER TABLE profiles ADD COLUMN major TEXT;'); } catch(e) {}

  const pCols = db.prepare('PRAGMA table_info(profiles)').all();
  console.log('Local profiles columns:', pCols.map(c => c.name));
  const aCols = db.prepare('PRAGMA table_info(accounts)').all();
  console.log('Local accounts columns:', aCols.map(c => c.name));
  db.close();
}
