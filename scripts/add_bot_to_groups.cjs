const { DatabaseSync } = require('node:sqlite');

try {
  const db = new DatabaseSync('build/local_replica.sqlite');
  const groups = db.prepare('SELECT id, name FROM chat_groups').all();
  console.log('Existing groups:', groups);
  const now = new Date().toISOString();
  let added = 0;
  for (const g of groups) {
    const res = db.prepare("INSERT OR IGNORE INTO chat_group_members (group_id, user_id, role, joined_at) VALUES (?, '3tg-bot', 'bot', ?)").run(g.id, now);
    if (res.changes > 0) added++;
  }
  console.log(`Added Bot 3TG to ${added} groups.`);
  const members = db.prepare('SELECT * FROM chat_group_members').all();
  console.log('Total group members count in local replica:', members.length);
} catch (err) {
  console.error('Error:', err);
}
