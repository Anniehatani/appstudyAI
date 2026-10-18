const accountId = 'f915ed0757fa4e116c1afe10952a3087';
const dbId = '89914e1e-bf4a-4dc7-9764-c0ae66276fe3';
const token = process.env.CLOUDFLARE_API_TOKEN || '';

async function query(sql) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql })
  });
  return await res.json();
}

async function run() {
  // 1. List all tables
  const tablesRes = await query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
  const tables = tablesRes.result[0].results.map(r => r.name).filter(n => !n.startsWith('_cf') && !n.startsWith('sqlite'));
  console.log('ALL TABLES IN D1:', tables);

  // 2. Get table schema for each
  for (const t of tables) {
    const info = await query(`PRAGMA table_info(${t});`);
    const cols = info.result[0].results.map(c => `${c.name} (${c.type}${c.pk ? ', PK' : ''})`);
    console.log(`\n=== Table: ${t} ===\n${cols.join(', ')}`);
  }
}

run().catch(console.error);
