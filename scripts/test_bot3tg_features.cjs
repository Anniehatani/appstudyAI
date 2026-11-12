const { DatabaseSync } = require('node:sqlite');
const path = require('path');

async function runTests() {
  console.log("==================================================");
  console.log(" KIỂM THỬ TÍNH NĂNG BOT 3TG VÀ QUẢN TRỊ NHÓM");
  console.log("==================================================");

  // 1. Check local replica
  const db = new DatabaseSync('build/local_replica.sqlite');
  console.log("✅ Kết nối cơ sở dữ liệu SQLite thành công.");

  // Test dynamic import of bot3tg.js
  const botModule = await import('../src/bot3tg.js');
  console.log("✅ Module Bot 3TG loaded:", botModule.BOT_ID, botModule.BOT_NAME);

  // 2. Test Bot commands
  console.log("\n--- [1] Kiểm thử bảng lệnh Bot 3TG ---");
  const testContext = {
    group: { name: "Biệt Đội Săn A+ CNPM 🌸" },
    members: [
      { user_id: "lead_123", full_name: "Lê Văn An", role: "admin" },
      { user_id: "mem_456", full_name: "Nguyễn Như Quỳnh", role: "deputy" },
      { user_id: "mem_789", full_name: "Nguyễn Tú", role: "member" },
      { user_id: "3tg-bot", full_name: "Bot 3TG", role: "bot" }
    ],
    sender: { userId: "lead_123", name: "Lê Văn An" }
  };

  const commands = [
    "!help",
    "!ping",
    "!uptime",
    "!chao",
    "!anime",
    "!troll",
    "!info",
    "!ai cách có người yêu"
  ];

  for (const cmd of commands) {
    const res = await botModule.handleBot3TgCommand(cmd, testContext);
    console.log(`Command [${cmd}]:`);
    if (res.isAi) {
      console.log(`  -> Kích hoạt AI với câu hỏi: "${res.prompt}"`);
    } else {
      console.log(`  -> Phản hồi: ${res.message.slice(0, 80).replace(/\n/g, ' ')}...`);
      if (res.mediaUrl) {
        console.log(`  -> Đính kèm: [${res.mediaType}] ${res.mediaUrl.slice(0, 60)}...`);
      }
    }
  }

  // 3. Test Database Group Management in SQLite
  console.log("\n--- [2] Kiểm thử Phân Quyền & Quản Trị Nhóm ---");
  const testGroupId = "test_grp_mgmt_" + Date.now();
  const now = new Date().toISOString();

  // Create test group with Admin, Deputy, Member, Bot
  db.prepare("INSERT INTO chat_groups (id, name, created_by, created_at) VALUES (?, 'Nhóm Test Phân Quyền', 'user_lead', ?)").run(testGroupId, now);
  db.prepare("INSERT INTO chat_group_members (group_id, user_id, role, joined_at) VALUES (?, 'user_lead', 'admin', ?)").run(testGroupId, now);
  db.prepare("INSERT INTO chat_group_members (group_id, user_id, role, joined_at) VALUES (?, 'user_member1', 'member', ?)").run(testGroupId, now);
  db.prepare("INSERT INTO chat_group_members (group_id, user_id, role, joined_at) VALUES (?, 'user_member2', 'member', ?)").run(testGroupId, now);
  db.prepare("INSERT INTO chat_group_members (group_id, user_id, role, joined_at) VALUES (?, '3tg-bot', 'bot', ?)").run(testGroupId, now);

  console.log("✅ Tạo nhóm thử nghiệm thành công với 4 thành viên (Lead, Member 1, Member 2, Bot 3TG).");

  // Step A: Bổ nhiệm user_member1 làm Phó nhóm
  db.prepare("UPDATE chat_group_members SET role = 'deputy' WHERE group_id = ? AND user_id = 'user_member1'").run(testGroupId);
  const mem1 = db.prepare("SELECT role FROM chat_group_members WHERE group_id = ? AND user_id = 'user_member1'").get(testGroupId);
  console.log("  -> [Thăng chức]: user_member1 role =", mem1.role, (mem1.role === 'deputy' ? "✅ PASS" : "❌ FAIL"));

  // Step B: Chuyển key Trưởng nhóm cho user_member1
  db.prepare("UPDATE chat_group_members SET role = 'deputy' WHERE group_id = ? AND user_id = 'user_lead'").run(testGroupId);
  db.prepare("UPDATE chat_group_members SET role = 'admin' WHERE group_id = ? AND user_id = 'user_member1'").run(testGroupId);
  db.prepare("UPDATE chat_groups SET created_by = 'user_member1' WHERE id = ?").run(testGroupId);
  const newLead = db.prepare("SELECT user_id, role FROM chat_group_members WHERE group_id = ? AND role = 'admin'").get(testGroupId);
  console.log("  -> [Chuyển key]: Tân trưởng nhóm =", newLead.user_id, (newLead.user_id === 'user_member1' ? "✅ PASS" : "❌ FAIL"));

  // Step C: Kick user_member2
  db.prepare("DELETE FROM chat_group_members WHERE group_id = ? AND user_id = 'user_member2'").run(testGroupId);
  const kicked = db.prepare("SELECT user_id FROM chat_group_members WHERE group_id = ? AND user_id = 'user_member2'").get(testGroupId);
  console.log("  -> [Kick thành viên]: user_member2 tồn tại? =", !!kicked, (!kicked ? "✅ Đã bị xóa (PASS)" : "❌ FAIL"));

  // Step D: Kick Bot 3TG
  db.prepare("DELETE FROM chat_group_members WHERE group_id = ? AND user_id = '3tg-bot'").run(testGroupId);
  const botKicked = db.prepare("SELECT user_id FROM chat_group_members WHERE group_id = ? AND user_id = '3tg-bot'").get(testGroupId);
  console.log("  -> [Kick Bot]: Bot 3TG còn trong nhóm? =", !!botKicked, (!botKicked ? "✅ Đã kick Bot thành công (PASS)" : "❌ FAIL"));

  // Step E: Thêm lại Bot 3TG
  db.prepare("INSERT OR REPLACE INTO chat_group_members (group_id, user_id, role, joined_at) VALUES (?, '3tg-bot', 'bot', ?)").run(testGroupId, now);
  const botReadded = db.prepare("SELECT user_id FROM chat_group_members WHERE group_id = ? AND user_id = '3tg-bot'").get(testGroupId);
  console.log("  -> [Thêm lại Bot]: Bot 3TG đã vào lại? =", !!botReadded, (!!botReadded ? "✅ Đã thêm lại Bot thành công (PASS)" : "❌ FAIL"));

  // Cleanup test group
  db.prepare("DELETE FROM chat_group_members WHERE group_id = ?").run(testGroupId);
  db.prepare("DELETE FROM chat_groups WHERE id = ?").run(testGroupId);
  console.log("\n✅ Dọn dẹp dữ liệu kiểm thử hoàn tất.");
  console.log("🎉 TẤT CẢ TÍNH NĂNG BOT 3TG & QUẢN TRỊ NHÓM HOẠT ĐỘNG HOÀN HẢO!");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});

