const accountId = 'f915ed0757fa4e116c1afe10952a3087';
const dbId = '89914e1e-bf4a-4dc7-9764-c0ae66276fe3';
const token = process.env.CLOUDFLARE_API_TOKEN || '';

async function query(sql, params = []) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params })
  });
  return await res.json();
}

async function run() {
  const uid = 'd6fe9be1-8be9-43af-9b6a-ac2cfdd0eccc';
  console.log('PROFILE:', (await query('SELECT * FROM profiles WHERE user_id = ?', [uid])).result[0].results);
  console.log('STATS:', (await query('SELECT * FROM user_stats WHERE user_id = ?', [uid])).result[0].results);
  console.log('LEADERBOARD:', (await query('SELECT * FROM weekly_leaderboards WHERE user_id = ?', [uid])).result[0].results);
  console.log('INVENTORY:', (await query('SELECT * FROM user_inventory WHERE user_id = ?', [uid])).result[0].results);
  console.log('ACHIEVEMENTS:', (await query('SELECT * FROM user_achievements WHERE user_id = ?', [uid])).result[0].results);
}
run();
