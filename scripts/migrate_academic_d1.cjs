const fs = require('fs');

const vars = Object.fromEntries(
  fs.readFileSync('.dev.vars', 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const accountId = vars.CLOUDFLARE_ACCOUNT_ID;
const dbId = vars.CLOUDFLARE_D1_DATABASE_ID;
const token = vars.CLOUDFLARE_API_TOKEN;

const sql = `
CREATE TABLE IF NOT EXISTS user_academic_transcripts (
  user_id TEXT PRIMARY KEY,
  student_code TEXT,
  full_name TEXT,
  major TEXT,
  class_name TEXT,
  gpa_10 REAL,
  gpa_4 REAL,
  total_credits INTEGER,
  raw_data TEXT,
  ai_analysis TEXT,
  target_gpa REAL,
  last_synced_at TEXT,
  created_at TEXT
);
`;

async function run() {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql })
  });
  const data = await res.json();
  console.log("Cloudflare D1 migration result:", JSON.stringify(data, null, 2));
}

run().catch(console.error);
