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
  const tables = ['accounts', 'profiles', 'user_stats', 'user_progress', 'user_inventory', 'user_achievements', 'weekly_leaderboards'];
  for (const t of tables) {
    const res = await query(`PRAGMA table_info(${t})`);
    console.log(`=== ${t} ===`);
    if (res.result && res.result[0]) {
      console.log(res.result[0].results.map(r => `${r.name} (${r.type})`).join(', '));
    } else {
      console.log(res);
    }
  }
}
run();
