const { DatabaseSync } = require('node:sqlite');
const miniflareDb = new DatabaseSync('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/f75f832ec585bb85cc81d12168a8e118a5d2af5ffff0f316e6a87a595cb351ec.sqlite');
const replicaDb = new DatabaseSync('build/local_replica.sqlite');

console.log('--- ĐỒNG BỘ DỮ LIỆU TÀI KHOẢN TỪ MINIFLARE SANG BUILD/LOCAL_REPLICA.SQLITE ---');

// Sync accounts
const accounts = miniflareDb.prepare('SELECT * FROM accounts').all();
for (const acc of accounts) {
  const existing = replicaDb.prepare('SELECT id FROM accounts WHERE user_id = ?').get(acc.user_id);
  if (!existing) {
    console.log('Adding account:', acc.username, acc.user_id);
    replicaDb.prepare('INSERT OR REPLACE INTO accounts (id, user_id, service_name, username, encrypted_password, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(acc.id, acc.user_id, acc.service_name || 'cmc', acc.username, acc.encrypted_password, acc.created_at);
  }
}

// Sync profiles
const profiles = miniflareDb.prepare('SELECT * FROM profiles').all();
for (const prof of profiles) {
  const existing = replicaDb.prepare('SELECT id FROM profiles WHERE user_id = ?').get(prof.user_id);
  if (!existing) {
    console.log('Adding profile:', prof.full_name, prof.user_id);
    replicaDb.prepare(`
      INSERT OR REPLACE INTO profiles (
        id, user_id, full_name, avatar_url, bio, cover_url, school, major, created_at,
        avatar_decoration, profile_effect, profile_theme, last_active_at, social_links, status_icon
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      prof.id || 'prof_' + prof.user_id,
      prof.user_id,
      prof.full_name || 'Lê Văn An',
      prof.avatar_url || null,
      prof.bio || '',
      prof.cover_url || '',
      prof.school || '',
      prof.major || '',
      prof.created_at || new Date().toISOString(),
      prof.avatar_decoration || null,
      prof.profile_effect || null,
      prof.profile_theme || null,
      prof.last_active_at || null,
      prof.social_links || '{}',
      prof.status_icon || null
    );
  } else {
    // Make sure full_name and avatar are up to date
    replicaDb.prepare('UPDATE profiles SET full_name = ?, avatar_url = ?, cover_url = ?, school = ?, major = ? WHERE user_id = ?')
      .run(prof.full_name, prof.avatar_url, prof.cover_url, prof.school, prof.major, prof.user_id);
  }
}

// Sync user_stats
const stats = miniflareDb.prepare('SELECT * FROM user_stats').all();
for (const st of stats) {
  const existing = replicaDb.prepare('SELECT user_id FROM user_stats WHERE user_id = ?').get(st.user_id);
  if (!existing) {
    console.log('Adding user_stats for:', st.user_id);
    replicaDb.prepare('INSERT OR REPLACE INTO user_stats (user_id, total_xp, current_streak, longest_streak, hearts, gems, last_active_date) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(st.user_id, st.total_xp || 0, st.current_streak || 0, st.longest_streak || 0, st.hearts == null ? 5 : st.hearts, st.gems || 0, st.last_active_date || null);
  } else {
    replicaDb.prepare('UPDATE user_stats SET total_xp = ?, current_streak = ?, longest_streak = ?, hearts = ?, gems = ? WHERE user_id = ?')
      .run(st.total_xp || 0, st.current_streak || 0, st.longest_streak || 0, st.hearts == null ? 5 : st.hearts, st.gems || 0, st.user_id);
  }
}

// Sync user_progress
const prog = miniflareDb.prepare('SELECT * FROM user_progress').all();
for (const p of prog) {
  replicaDb.prepare('INSERT OR IGNORE INTO user_progress (id, user_id, lesson_id, status, score, completed_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(p.id, p.user_id, p.lesson_id, p.status, p.score, p.completed_at);
}

// Sync user_achievements
try {
  const ach = miniflareDb.prepare('SELECT * FROM user_achievements').all();
  for (const a of ach) {
    replicaDb.prepare('INSERT OR IGNORE INTO user_achievements (id, user_id, achievement_id, unlocked_at) VALUES (?, ?, ?, ?)')
      .run(a.id || Math.random().toString(36).slice(2), a.user_id, a.achievement_id || a.achievement_code || 'first_lesson', a.unlocked_at || new Date().toISOString());
  }
} catch (e) {
  console.log('Skipping achievements:', e.message);
}

// Sync user_inventory
const inv = miniflareDb.prepare('SELECT * FROM user_inventory').all();
for (const item of inv) {
  replicaDb.prepare('INSERT OR REPLACE INTO user_inventory (id, user_id, item_code, quantity) VALUES (?, ?, ?, ?)')
    .run(item.id, item.user_id, item.item_code, item.quantity);
}

console.log('Sync finished successfully!');
const leVanAnInReplica = replicaDb.prepare("SELECT a.username, p.full_name, p.user_id FROM accounts a JOIN profiles p ON p.user_id = a.user_id WHERE p.full_name LIKE '%Lê Văn An%'").all();
console.log('Lê Văn An in replica DB:', leVanAnInReplica);
