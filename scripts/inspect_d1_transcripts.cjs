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

async function run() {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${vars.CLOUDFLARE_ACCOUNT_ID}/d1/database/${vars.CLOUDFLARE_D1_DATABASE_ID}/query`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + vars.CLOUDFLARE_API_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: "SELECT raw_data FROM user_academic_transcripts WHERE user_id = 'bb312c7e-3011-436f-80a9-93bd4f984e17'" })
  });
  const data = await res.json();
  const raw = data.result?.[0]?.results?.[0]?.raw_data;
  if (!raw) {
    console.log("No raw data found for bb312c7e");
    return;
  }
  const p = JSON.parse(raw);
  console.log("=== USER bb312c7e GPA ===");
  console.log(p.gpa);
  console.log("=== SEMESTERS & SUBJECTS ===");
  p.semesters.forEach(s => {
    console.log(`\n[${s.semester_name}] (GPA 4: ${s.gpa_4}, GPA 10: ${s.gpa_10}, TC: ${s.total_credits})`);
    s.subjects.forEach(sub => {
      console.log(`  - ${sub.ma_mon} | ${sub.ten_hoc_phan} | TC: ${sub.so_tin_chi} | Hệ 10: ${sub.diem_he_10} | Hệ 4: ${sub.diem_he_4} | Điểm chữ: '${sub.diem_chu}'`);
    });
  });
}

run().catch(console.error);
