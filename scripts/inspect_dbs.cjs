const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

function checkDb(filePath) {
  console.log('=== Checking:', filePath);
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist!');
    return;
  }
  const db = new DatabaseSync(filePath);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables.map(t => t.name).join(', '));
  try {
    const pCols = db.prepare("PRAGMA table_info(profiles)").all();
    console.log('profiles cols:', pCols.map(c => c.name).join(', '));
  } catch(e) {
    console.log('profiles err:', e.message);
  }
  try {
    const pomo = db.prepare("PRAGMA table_info(user_pomodoro_sessions)").all();
    console.log('user_pomodoro_sessions cols:', pomo.map(c => c.name).join(', '));
  } catch(e) {
    console.log('user_pomodoro_sessions err:', e.message);
  }
}

checkDb('build/local_replica.sqlite');

const d1Dir = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
if (fs.existsSync(d1Dir)) {
  fs.readdirSync(d1Dir).filter(f => f.endsWith('.sqlite')).forEach(f => {
    checkDb(path.join(d1Dir, f));
  });
}
