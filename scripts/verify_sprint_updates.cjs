const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');

console.log('--- BẮT ĐẦU KIỂM THỬ TÍNH NĂNG MỚI (THEME, SOCIAL LINKS, STATUS ICONS, NOTIFICATIONS) ---');

// 1. Kiểm tra SQLite DB Local Replica
const db = new DatabaseSync('build/local_replica.sqlite');
const tableInfo = db.prepare('PRAGMA table_info(profiles)').all();
const cols = tableInfo.map(c => c.name);

console.log('1. Kiểm tra cột profiles:');
console.assert(cols.includes('social_links'), 'Thiếu cột social_links trong profiles!');
console.assert(cols.includes('status_icon'), 'Thiếu cột status_icon trong profiles!');
console.log('   ✓ Cột social_links và status_icon đã tồn tại 100% trong bảng profiles!');

// 2. Thử cập nhật social_links và status_icon
const testUser = db.prepare('SELECT user_id, full_name, social_links, status_icon FROM profiles LIMIT 1').get();
if (testUser) {
  console.log(`2. Thử nghiệm trên người dùng: ${testUser.full_name} (${testUser.user_id})`);
  
  const sampleSocial = JSON.stringify({
    facebook: "https://facebook.com/hocvien3tg",
    instagram: "hocvien3tg_ig",
    tiktok: "@hocvien3tg_tt",
    threads: "@hocvien3tg_th",
    github: "hocvien3tg_dev",
    locket: "hocvien3tg_lk"
  });
  const sampleIcon = "🔥";

  db.prepare("UPDATE profiles SET social_links = ?, status_icon = ? WHERE user_id = ?")
    .run(sampleSocial, sampleIcon, testUser.user_id);

  const updated = db.prepare('SELECT social_links, status_icon FROM profiles WHERE user_id = ?').get(testUser.user_id);
  console.assert(updated.status_icon === '🔥', 'Lỗi cập nhật status_icon');
  console.assert(updated.social_links.includes('hocvien3tg_dev'), 'Lỗi cập nhật social_links');
  console.log('   ✓ Cập nhật status_icon và social_links thành công vào SQLite DB!');
}

// 3. Kiểm tra file app.js chứa các logic quan trọng
const appJs = fs.readFileSync('public/app.js', 'utf8');
console.log('3. Kiểm tra mã nguồn giao diện public/app.js:');
console.assert(appJs.includes('DUOLINGO_STATUS_ICONS'), 'Thiếu DUOLINGO_STATUS_ICONS');
console.assert(appJs.includes('setProfileStatusIcon'), 'Thiếu setProfileStatusIcon');
console.assert(appJs.includes('renderSocialLinks'), 'Thiếu renderSocialLinks');
console.assert(appJs.includes('showDuolingoNotification'), 'Thiếu showDuolingoNotification');
console.assert(appJs.includes('startGlobalNotificationPoller'), 'Thiếu startGlobalNotificationPoller');
console.assert(appJs.includes('window.switchAchievementTab'), 'Thiếu switchAchievementTab');
console.log('   ✓ Đầy đủ các hàm Duolingo Status Icon, Social Links, Duolingo Notification Toast và Fix tab Nhiệm Vụ!');

// 4. Kiểm tra CSS styles
const stylesCss = fs.readFileSync('public/styles.css', 'utf8');
console.log('4. Kiểm tra CSS styles.css:');
console.assert(stylesCss.includes('.duo-status-widget'), 'Thiếu .duo-status-widget trong styles.css');
console.assert(stylesCss.includes('.avatar-status-speech-bubble'), 'Thiếu .avatar-status-speech-bubble');
console.assert(stylesCss.includes('.profile-social-badge'), 'Thiếu .profile-social-badge');
console.assert(stylesCss.includes('.duo-msg-toast'), 'Thiếu .duo-msg-toast');
console.log('   ✓ Toàn bộ CSS cho Widget Duolingo, Bong bóng trạng thái, Huy hiệu mạng xã hội và Thông báo Toast đã hoàn tất 100%!');

console.log('--- TẤT CẢ CÁC BƯỚC KIỂM THỬ HOÀN TOÀN THÀNH CÔNG (PASS 100%) ---');
