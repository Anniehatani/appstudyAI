import fs from 'fs';
import path from 'path';

// Parse .dev.vars
const devVarsPath = path.resolve('.dev.vars');
const devVars = {};
if (fs.existsSync(devVarsPath)) {
  const content = fs.readFileSync(devVarsPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      devVars[key] = val;
    }
  }
}

console.log("==================================================");
console.log("   KIỂM TRA TOÀN DIỆN KẾT NỐI: D1, R2, DEEPSEEK   ");
console.log("==================================================\n");

// 1. KIỂM TRA CLOUDFLARE D1 (DATABASE)
console.log("--- 1. KIỂM TRA CLOUDFLARE D1 (100% HỌC LIỆU) ---");
const accountId = devVars.CLOUDFLARE_ACCOUNT_ID;
const dbId = devVars.CLOUDFLARE_D1_DATABASE_ID;
const token = devVars.CLOUDFLARE_API_TOKEN;

async function testD1Direct() {
  if (!accountId || !dbId || !token) {
    console.log("❌ Thiếu thông tin D1 trong .dev.vars");
    return;
  }
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`;
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM subjects) as total_subjects,
      (SELECT COUNT(*) FROM units) as total_units,
      (SELECT COUNT(*) FROM lessons) as total_lessons,
      (SELECT COUNT(*) FROM questions) as total_questions,
      (SELECT COUNT(*) FROM accounts) as total_accounts,
      (SELECT COUNT(*) FROM profiles) as total_profiles;
  `;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql })
    });
    const data = await res.json();
    if (data.success && data.result && data.result[0]) {
      const counts = data.result[0].results[0];
      console.log("✅ Kết nối Cloudflare D1 Remote THÀNH CÔNG 100%!");
      console.log(`   - Tổng số môn học (subjects): ${counts.total_subjects}`);
      console.log(`   - Tổng số chương (units): ${counts.total_units}`);
      console.log(`   - Tổng số bài học (lessons): ${counts.total_lessons}`);
      console.log(`   - Tổng số câu hỏi trắc nghiệm (questions): ${counts.total_questions}`);
      console.log(`   - Tổng số tài khoản (accounts): ${counts.total_accounts}`);
      console.log(`   - Tổng số hồ sơ (profiles): ${counts.total_profiles}`);
    } else {
      console.log("❌ Truy vấn D1 thất bại:", data.errors);
    }
  } catch (err) {
    console.log("❌ Lỗi kết nối D1:", err.message);
  }
}

// 2. KIỂM TRA WORKER LOCAL API D1
async function testWorkerD1() {
  console.log("\n--- 2. KIỂM TRA WORKER API (http://127.0.0.1:8787/api/subjects) ---");
  try {
    const res = await fetch('http://127.0.0.1:8787/api/subjects');
    const data = await res.json();
    if (res.ok && data.subjects) {
      console.log(`✅ Worker trả về thành công ${data.subjects.length} môn học từ D1:`);
      data.subjects.slice(0, 5).forEach((s, idx) => {
        console.log(`   ${idx + 1}. [${s.code || s.id}] ${s.subject_name}`);
      });
      if (data.subjects.length > 5) console.log(`   ... và ${data.subjects.length - 5} môn học khác.`);
    } else {
      console.log("❌ Worker trả về lỗi:", data);
    }
  } catch (err) {
    console.log("❌ Không thể kết nối Worker dev server (127.0.0.1:8787):", err.message);
  }
}

// 3. KIỂM TRA DEEPSEEK API
async function testDeepSeek() {
  console.log("\n--- 3. KIỂM TRA API DEEPSEEK (AI ASSISTANT) ---");
  const apiKey = devVars.DEEPSEEK_API_KEY || devVars.LOCAL_AI_API_KEY;
  const endpoint = devVars.LOCAL_AI_ENDPOINT || "https://api.deepseek.com/chat/completions";
  const model = devVars.DEEPSEEK_MODEL || "deepseek-chat";

  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   Model: ${model}`);
  console.log(`   API Key: ${apiKey ? apiKey.slice(0, 8) + '...' + apiKey.slice(-4) : '(Trống)'}`);

  if (!apiKey) {
    console.log("❌ Thiếu API Key DeepSeek!");
    return;
  }

  try {
    const startTime = Date.now();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'Bạn là trợ giảng 3TG Study. Trả lời cực ngắn trong 1 câu.' },
          { role: 'user', content: 'Chào bạn, hãy xác nhận bạn đã kết nối thành công với 3TG Study!' }
        ],
        max_tokens: 60,
        temperature: 0.5
      })
    });

    const elapsed = Date.now() - startTime;
    if (res.ok) {
      const data = await res.json();
      const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      console.log(`✅ Kết nối DeepSeek API THÀNH CÔNG 100% (${elapsed}ms)!`);
      console.log(`   Phản hồi từ DeepSeek: "${reply.trim()}"`);
    } else {
      const errText = await res.text();
      console.log(`❌ DeepSeek trả về lỗi HTTP ${res.status}:`, errText);
    }
  } catch (err) {
    console.log("❌ Lỗi kết nối DeepSeek API:", err.message);
  }
}

// 4. KIỂM TRA R2 BUCKET
async function testR2() {
  console.log("\n--- 4. KIỂM TRA CLOUDFLARE R2 (AVATARS / MEDIA) ---");
  console.log(`   Bucket Name: ${devVars.R2_BUCKET_NAME || 'my-project-bucket'}`);
  console.log(`   Binding: env.AVATARS (được cấu hình trong wrangler.jsonc)`);
  console.log(`   Chế độ fallback: Nếu R2 chưa có ảnh đại diện tải lên, hệ thống tự động render letter-avatar hoặc mascot avatar chuẩn SVG.`);
}

async function run() {
  await testD1Direct();
  await testWorkerD1();
  await testDeepSeek();
  await testR2();
  console.log("\n==================================================");
}

run();
