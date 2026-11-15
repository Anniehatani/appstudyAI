const fs = require('fs');

const dotenv = fs.readFileSync('.env', 'utf8');
const env = {};
dotenv.split('\n').forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const endpoint = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${env.CLOUDFLARE_D1_DATABASE_ID}/query`;

async function queryRemote(sql, params = []) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql, params })
  });
  return res.json();
}

async function run() {
  console.log('--- Checking Remote Cloudflare D1 ---');
  const tablesRes = await queryRemote("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tables:', tablesRes.result?.[0]?.results?.map(r => r.name));

  const pColsRes = await queryRemote("PRAGMA table_info(profiles)");
  console.log('Profiles cols:', pColsRes.result?.[0]?.results?.map(r => r.name));

  const migrations = [
    "ALTER TABLE profiles ADD COLUMN avatar_decoration TEXT",
    "ALTER TABLE profiles ADD COLUMN profile_effect TEXT",
    "ALTER TABLE profiles ADD COLUMN profile_theme TEXT",
    "ALTER TABLE profiles ADD COLUMN social_links TEXT",
    "ALTER TABLE profiles ADD COLUMN status_icon TEXT",
    `CREATE TABLE IF NOT EXISTS user_pomodoro_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      cycles INTEGER DEFAULT 1,
      focus_minutes INTEGER DEFAULT 25,
      xp_reward INTEGER DEFAULT 50,
      gems_reward INTEGER DEFAULT 30,
      doc_name TEXT,
      completed_at TEXT DEFAULT (datetime('now'))
    )`
  ];

  for (const m of migrations) {
    console.log('Applying migration:', m.slice(0, 50) + '...');
    const res = await queryRemote(m);
    if (!res.success) {
      console.log('  Result notice/error:', res.errors?.[0]?.message || res);
    } else {
      console.log('  SUCCESS');
    }
  }

  console.log('--- Verify Remote Cloudflare D1 ---');
  const verifyCols = await queryRemote("PRAGMA table_info(profiles)");
  console.log('Updated profiles cols:', verifyCols.result?.[0]?.results?.map(r => r.name));

  const verifyPomo = await queryRemote("PRAGMA table_info(user_pomodoro_sessions)");
  console.log('user_pomodoro_sessions cols:', verifyPomo.result?.[0]?.results?.map(r => r.name));
}

run().catch(console.error);
