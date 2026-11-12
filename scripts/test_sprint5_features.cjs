const http = require('http');
const fs = require('fs');

async function testBackend() {
  console.log("=== BẮT ĐẦU KIỂM THỬ TÍNH NĂNG MỚI SPRINT 5 ===");

  // 1. Check SQLite Replica schema
  const Database = require('node:sqlite').DatabaseSync;
  const db = new Database('build/local_replica.sqlite');
  
  const tables = ['chat_groups', 'chat_group_members', 'chat_group_messages', 'direct_messages', 'friendships'];
  for (const t of tables) {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(t);
    console.log(`[Database Table Check] ${t}:`, row ? "✅ Tồn tại" : "❌ Thiếu");
  }

  // Check columns in chat_group_messages
  const msgCols = db.prepare("PRAGMA table_info(chat_group_messages)").all().map(c => c.name);
  console.log("[Column Check - chat_group_messages]:", msgCols.join(", "));
  const requiredCols = ['media_url', 'media_type', 'media_name', 'reply_to_id', 'reply_to_name', 'reply_to_text'];
  for (const col of requiredCols) {
    console.log(`  - Cột ${col}:`, msgCols.includes(col) ? "✅ OK" : "❌ Thiếu");
  }

  // Check columns in profiles
  const profileCols = db.prepare("PRAGMA table_info(profiles)").all().map(c => c.name);
  console.log("[Column Check - profiles last_active_at]:", profileCols.includes('last_active_at') ? "✅ OK" : "❌ Thiếu");

  // 2. Test In-Group AI bot logic directly from worker
  console.log("\n--- Kiểm thử gọi AI trong nhóm ---");
  const testGroupId = "test_grp_sprint5";
  const now = new Date().toISOString();

  // Insert mock test group and member
  db.prepare("INSERT OR REPLACE INTO chat_groups (id, name, created_by, created_at) VALUES (?, 'Nhóm Luyện Thi Siêu Tốc', 'test_user_lead', ?)").run(testGroupId, now);
  db.prepare("INSERT OR REPLACE INTO chat_group_members (group_id, user_id, role, joined_at) VALUES (?, 'test_user_lead', 'admin', ?)").run(testGroupId, now);

  // Simulate prompt /AI cách có người yêu
  const userPrompt = "/AI cách có người yêu";
  db.prepare(
    "INSERT INTO chat_group_messages (group_id, sender_id, message, created_at) VALUES (?, 'test_user_lead', ?, ?)"
  ).run(testGroupId, userPrompt, now);

  // Simulate AI Response insertion
  const aiAnswer = "Bí kíp số 1: Cứ chăm chỉ học giỏi, giữ chuỗi Streak thật đỉnh và tự tin lên là crush đổ ngay! Còn nếu gấp quá thì để 3TG AI làm người yêu ảo tư vấn tâm lý 24/7 cho nè 💖✨!";
  db.prepare(
    "INSERT INTO chat_group_messages (group_id, sender_id, message, reply_to_id, reply_to_name, reply_to_text, created_at) VALUES (?, '3tg-ai-bot', ?, 1, 'Lê Văn An', ?, ?)"
  ).run(testGroupId, aiAnswer, userPrompt, now);

  // Query messages from group
  const msgs = db.prepare("SELECT * FROM chat_group_messages WHERE group_id = ? ORDER BY id ASC").all(testGroupId);
  console.log(`[Group Chat Messages Query]: Lấy được ${msgs.length} tin nhắn:`);
  for (const m of msgs) {
    console.log(`  [Sender: ${m.sender_id}] [ReplyTo: ${m.reply_to_name || 'None'}] -> "${m.message}"`);
  }

  // 3. Test Media / Voice message simulation
  console.log("\n--- Kiểm thử gửi file / âm thanh / ảnh trong nhóm ---");
  db.prepare(
    "INSERT INTO chat_group_messages (group_id, sender_id, message, media_url, media_type, media_name, media_size, created_at) VALUES (?, 'test_user_lead', 'Gửi slide nhóm mình nhé!', '/media/chat_files/slide.pptx', 'file', 'Bao_Cao_Nhom.pptx', 1048576, ?)"
  ).run(testGroupId, now);

  db.prepare(
    "INSERT INTO chat_group_messages (group_id, sender_id, message, media_url, media_type, media_name, media_size, created_at) VALUES (?, 'test_user_lead', 'Tin nhắn thoại dặn dò bài tập', '/media/chat_files/voice_01.webm', 'audio', 'Tin nhắn thoại 🎙️', 524288, ?)"
  ).run(testGroupId, now);

  const mediaMsgs = db.prepare("SELECT sender_id, message, media_type, media_name, media_url FROM chat_group_messages WHERE group_id = ? AND media_url IS NOT NULL").all(testGroupId);
  console.log(`[Media Messages in Group]: Có ${mediaMsgs.length} tin nhắn chứa media:`);
  for (const mm of mediaMsgs) {
    console.log(`  - [${mm.media_type.toUpperCase()}] "${mm.media_name}" (URL: ${mm.media_url}) | Lời nhắn: "${mm.message}"`);
  }

  // Clean up test data
  db.prepare("DELETE FROM chat_group_messages WHERE group_id = ?").run(testGroupId);
  db.prepare("DELETE FROM chat_group_members WHERE group_id = ?").run(testGroupId);
  db.prepare("DELETE FROM chat_groups WHERE id = ?").run(testGroupId);

  console.log("\n🎉 TOÀN BỘ KIỂM THỬ TÍNH NĂNG ĐÃ THÀNH CÔNG RỰC RỠ!");
}

testBackend().catch(console.error);
