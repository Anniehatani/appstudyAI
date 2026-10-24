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
  const p = JSON.parse(raw);
  const allSubs = [];
  p.semesters.forEach(s => allSubs.push(...s.subjects));

  function isGpaSubject(m) {
    const letter = String(m.diem_chu || '').trim().toUpperCase();
    if (['P', 'NP', 'ĐẠT', 'DAT', 'M', 'MIỄN', 'MIEN', 'KĐ', 'KD', 'I', 'W'].includes(letter)) return false;
    const name = String(m.ten_hoc_phan || '').toLowerCase();
    const code = String(m.ma_mon || '').toUpperCase();
    if (/thể dục|thể chất|đá cầu|bóng rổ|bóng chuyền|bóng bàn|bơi lội|điền kinh|quốc phòng|an ninh|gdqp/i.test(name)) return false;
    if (/^GENE101[0-9]/.test(code) || /^MIL/.test(code)) return false;
    if (/^ENG-100[1-9]/.test(code) && (Number(m.diem_he_4) === 0 || letter === 'P')) return false;
    return true;
  }

  let totalTC = 0, sum4 = 0, sum10 = 0;
  allSubs.forEach(m => {
    if (isGpaSubject(m)) {
      totalTC += m.so_tin_chi;
      sum4 += m.diem_he_4 * m.so_tin_chi;
      sum10 += m.diem_he_10 * m.so_tin_chi;
    }
  });
  console.log('Total GPA Credits:', totalTC);
  console.log('GPA 4:', (sum4 / totalTC).toFixed(2));
  console.log('GPA 10:', (sum10 / totalTC).toFixed(2));
}

run().catch(console.error);
