const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync("build/local_replica.sqlite");

db.exec("UPDATE user_stats SET gems = 9999 WHERE user_id = 'd6fe9be1-8be9-43af-9b6a-ac2cfdd0eccc'");
db.exec("UPDATE profiles SET avatar_url = 'mascot:king-champion' WHERE user_id = 'd6fe9be1-8be9-43af-9b6a-ac2cfdd0eccc' AND avatar_url LIKE '/media/avatars/%'");
const userStat = db.prepare("SELECT gems FROM user_stats WHERE user_id = 'd6fe9be1-8be9-43af-9b6a-ac2cfdd0eccc'").get();
const userProf = db.prepare("SELECT avatar_url, cover_url FROM profiles WHERE user_id = 'd6fe9be1-8be9-43af-9b6a-ac2cfdd0eccc'").get();
console.log("Local replica user gems:", userStat?.gems);
console.log("Local replica user profile:", userProf);

db.exec("UPDATE shop_items SET price_gems = 100 WHERE item_code LIKE 'deco_%' OR item_code LIKE 'bg_%' OR item_code LIKE 'mascot_%'");
const shopRows = db.prepare("SELECT item_code, price_gems FROM shop_items WHERE item_code LIKE 'deco_%' OR item_code LIKE 'bg_%' OR item_code LIKE 'mascot_%'").all();
console.log("Total updated shop items in local replica:", shopRows.length);
console.log("All 100?", shopRows.every(r => r.price_gems === 100));
