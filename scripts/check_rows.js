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
  const res = await query('SELECT * FROM accounts LIMIT 5;');
  console.log('ACCOUNTS:', res.result[0].results);
  const pRes = await query('SELECT * FROM profiles LIMIT 5;');
  console.log('PROFILES:', pRes.result[0].results);
  const sRes = await query('SELECT * FROM user_stats LIMIT 5;');
  console.log('STATS:', sRes.result[0].results);
}
run();
