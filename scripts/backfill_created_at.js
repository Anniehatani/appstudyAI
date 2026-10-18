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
  await query("UPDATE profiles SET created_at = '2026-10-12 00:00:00' WHERE created_at IS NULL");
  await query("UPDATE accounts SET created_at = '2026-10-12 00:00:00' WHERE created_at IS NULL");
  console.log("Updated remote D1 created_at for existing users");
}
run();
