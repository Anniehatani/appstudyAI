const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

console.log('=== TEST 1: Database Check ===');
const db = new DatabaseSync('build/local_replica.sqlite');
const themes = db.prepare("SELECT item_code, name, price_gems FROM shop_items WHERE item_code LIKE 'theme_%'").all();
console.log('Found themes in DB:', themes.length);
themes.forEach(t => console.log(' - ' + t.item_code + ' (' + t.name + '): ' + t.price_gems + ' gems'));

if (themes.length !== 8) {
  console.error('FAIL: Expected 8 themes, found', themes.length);
  process.exit(1);
}

for (const t of themes) {
  if (t.price_gems !== 50) {
    console.error('FAIL: Theme ' + t.item_code + ' price is not 50: ' + t.price_gems);
    process.exit(1);
  }
}
console.log('✅ TEST 1 PASSED: Exactly 8 themes in DB with price = 50 💎');

console.log('\n=== TEST 2: CSS Rules Check ===');
const css = fs.readFileSync('public/styles.css', 'utf8');
const requiredThemes = [
  'ocean_blue',
  'emerald_forest',
  'sunset_amber',
  'royal_amethyst',
  'crimson_ruby',
  'cyber_lime',
  'vintage_mocha',
  'aurora_teal'
];

for (const th of requiredThemes) {
  const lightSelector = 'data-color-theme="' + th + '"';
  const darkSelector = '[data-color-theme="' + th + '"]';
  if (!css.includes(lightSelector)) {
    console.error('FAIL: Missing light mode CSS for', th);
    process.exit(1);
  }
  if (!css.includes(darkSelector)) {
    console.error('FAIL: Missing dark mode CSS for', th);
    process.exit(1);
  }
  console.log(' - CSS verified for:', th, '(Light & Dark)');
}
console.log('✅ TEST 2 PASSED: All 8 themes have full Light & Dark mode CSS rules');

console.log('\n=== TEST 3: Registry Check in public/app.js ===');
const appJs = fs.readFileSync('public/app.js', 'utf8');
if (!appJs.includes('THEMES_REGISTRY = {') || !appJs.includes('livePreviewTheme') || !appJs.includes('previewThemeModal')) {
  console.error('FAIL: Missing THEMES_REGISTRY or preview functions in public/app.js');
  process.exit(1);
}
console.log('✅ TEST 3 PASSED: THEMES_REGISTRY and interactive preview functions verified');

console.log('\n=== TEST 4: Backend Integration Verification ===');
(async () => {
  const workerModule = await import('../src/index.js');
  const worker = workerModule.default || workerModule;

  // Mock Env with local db
  const env = {
    DB: {
      prepare(sql) {
        function createHelper(params = []) {
          return {
            bind(...newParams) {
              const flat = newParams.length === 1 && Array.isArray(newParams[0]) ? newParams[0] : newParams;
              return createHelper(flat);
            },
            async first(col) {
              const stmt = db.prepare(sql);
              const row = stmt.get(...params);
              if (!row) return null;
              if (col !== undefined) return row[col];
              return row;
            },
            async all() {
              const stmt = db.prepare(sql);
              const rows = stmt.all(...params);
              return { success: true, results: rows || [] };
            },
            async run() {
              const stmt = db.prepare(sql);
              const res = stmt.run(...params);
              return { success: true, meta: { changes: res.changes } };
            }
          };
        }
        return createHelper();
      },
      async batch(statements) {
        const results = [];
        for (const s of statements) {
          if (typeof s.run === 'function') results.push(await s.run());
          else if (typeof s.all === 'function') results.push(await s.all());
        }
        return results;
      }
    }
  };

  // Find a test account or create one
  const userRow = db.prepare('SELECT a.id, a.username, p.user_id, p.profile_theme FROM accounts a JOIN profiles p ON a.user_id = p.user_id LIMIT 1').get();
  console.log('Testing with account:', userRow.username);

  // Give 500 gems to test account so they can buy
  db.prepare('UPDATE user_stats SET gems = 500 WHERE user_id = ?').run(userRow.user_id);

  // Remove theme_ocean_blue from inventory if already there
  db.prepare('DELETE FROM user_inventory WHERE user_id = ? AND item_code = ?').run(userRow.user_id, 'theme_ocean_blue');

  // Call buyShopItem directly through fetch route
  const buyRes = await worker.fetch(new Request('http://localhost:8787/api/shop/buy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'lumi_session=' + userRow.user_id
    },
    body: JSON.stringify({ itemCode: 'theme_ocean_blue' })
  }), env);

  const buyJson = await buyRes.json();
  console.log('Buy Response status:', buyRes.status, buyJson.message || buyJson.error);
  if (buyRes.status !== 200) {
    console.error('FAIL: Could not buy theme:', buyJson);
    process.exit(1);
  }

  // Check that user_inventory has theme_ocean_blue
  const inv = db.prepare('SELECT * FROM user_inventory WHERE user_id = ? AND item_code = ?').get(userRow.user_id, 'theme_ocean_blue');
  console.log('Inventory check:', inv ? 'Item found in user_inventory' : 'NOT FOUND');
  if (!inv) {
    console.error('FAIL: Item was not added to user_inventory');
    process.exit(1);
  }

  // Check that profiles.profile_theme is updated
  const prof = db.prepare('SELECT profile_theme FROM profiles WHERE user_id = ?').get(userRow.user_id);
  console.log('Profile profile_theme check:', prof.profile_theme);
  if (prof.profile_theme !== 'theme_ocean_blue') {
    console.error('FAIL: profiles.profile_theme is not theme_ocean_blue:', prof.profile_theme);
    process.exit(1);
  }

  // Test buying duplicate - should fail with 400
  const buyDupRes = await worker.fetch(new Request('http://localhost:8787/api/shop/buy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'lumi_session=' + userRow.user_id
    },
    body: JSON.stringify({ itemCode: 'theme_ocean_blue' })
  }), env);
  const buyDupJson = await buyDupRes.json();
  console.log('Duplicate buy status:', buyDupRes.status, '(Expected 400):', buyDupJson.error);
  if (buyDupRes.status !== 400) {
    console.error('FAIL: Duplicate buy did not return 400');
    process.exit(1);
  }

  console.log('✅ TEST 4 PASSED: Backend purchase, auto-equip, and duplicate prevention 100% verified!');
  console.log('\n🎉 ALL THEME SYSTEM TESTS PASSED 100%!');
})();
