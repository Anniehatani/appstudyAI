const { DatabaseSync } = require('node:sqlite');
const miniflareDb = new DatabaseSync('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/f75f832ec585bb85cc81d12168a8e118a5d2af5ffff0f316e6a87a595cb351ec.sqlite');
const replicaDb = new DatabaseSync('build/local_replica.sqlite');

const tables = miniflareDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all().map(t => t.name);

console.log('Comparing row counts:');
for (const tbl of tables) {
  try {
    const miniCount = miniflareDb.prepare(`SELECT COUNT(*) AS c FROM ${tbl}`).get().c;
    let replCount = 'N/A';
    try {
      replCount = replicaDb.prepare(`SELECT COUNT(*) AS c FROM ${tbl}`).get().c;
    } catch (e) { replCount = 'TABLE MISSING'; }
    console.log(`${tbl}: miniflare=${miniCount}, replica=${replCount}`);
  } catch (err) {
    console.log(`${tbl}: error ${err.message}`);
  }
}
