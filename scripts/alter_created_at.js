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
  try {
    const res1 = await query("ALTER TABLE profiles ADD COLUMN created_at TEXT;");
    console.log("ALTER profiles created_at:", res1);
  } catch(e) { console.log("err profiles:", e); }
  
  try {
    const res2 = await query("ALTER TABLE accounts ADD COLUMN created_at TEXT;");
    console.log("ALTER accounts created_at:", res2);
  } catch(e) { console.log("err accounts:", e); }
}
run();
