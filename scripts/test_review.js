import fs from 'fs';
import path from 'path';

const devVars = {};
const devVarsPath = path.resolve('.dev.vars');
if (fs.existsSync(devVarsPath)) {
  for (const line of fs.readFileSync(devVarsPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) devVars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
}

const token = process.env.CLOUDFLARE_API_TOKEN || devVars.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || devVars.CLOUDFLARE_ACCOUNT_ID;
const dbId = process.env.CLOUDFLARE_D1_DATABASE_ID || devVars.CLOUDFLARE_D1_DATABASE_ID;

async function applyMigrations() {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`;

  const statements = [
    `CREATE TABLE IF NOT EXISTS user_daily_quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      quest_date TEXT NOT NULL,
      quest_code TEXT NOT NULL,
      claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, quest_date, quest_code)
    );`,
    `CREATE TABLE IF NOT EXISTS user_leaderboard_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      week_start_date TEXT NOT NULL,
      rank INTEGER NOT NULL,
      gems_awarded INTEGER NOT NULL,
      claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, week_start_date)
    );`,
    `INSERT OR IGNORE INTO shop_items (id, item_code, name, description, price_gems) VALUES
    (5, 'mascot_pack_champions', 'Gói Mascot Thỏ Chiến Thần (7 Mascots)', 'Mở khóa 7 biểu cảm Thỏ Bảy Màu siêu đỉnh cao: Vua Vô Địch, Kiếm Sĩ, Ăn Mừng VN, Bùng Cháy Lửa, Cưỡi Mây, Thám Tử Bắt Lỗi, Siêu Sao XP với hiệu ứng hoạt hình sống động.', 150),
    (6, 'mascot_pack_cosplay', 'Gói Mascot Thỏ Hóa Trang Anime (7 Mascots)', 'Mở khóa 7 biểu cảm Thỏ Bảy Màu siêu dễ thương: Hầu Gái Kawaii, Giáo Sư AI Bác Học, Đại Gia Đá Quý, Cổ Vũ Pom-Pom, Hốt Hoảng, Mếu Máo, Giận Dỗi.', 150);`
  ];

  for (const sql of statements) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ sql })
    });
    const data = await res.json();
    console.log("Migration executed:", sql.slice(0, 40) + "...", "Success:", data.success);
    if (!data.success) {
      console.error(data.errors);
    }
  }
}
applyMigrations();
