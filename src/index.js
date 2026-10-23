import { loginIUPortal, layBangDiemVaHoSoIU, processAcademicTranscript, generateAcademicAdvisorPlan } from "./academic_service.js";

const COOKIE_NAME = "lumi_session";
const COOKIE_AGE = 60 * 60 * 24 * 365;
const DEFAULT_SETTINGS = { dailyGoal: 15 };

function respond(data, status, extraHeaders) {
  const headers = new Headers(extraHeaders || {});
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET, POST, OPTIONS, PATCH, DELETE");
  headers.set("access-control-allow-headers", "content-type, authorization");
  return new Response(JSON.stringify(data), { status: status || 200, headers });
}

function getCookie(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const pairs = cookie.split(";");
  for (const pair of pairs) {
    const part = pair.trim();
    const equals = part.indexOf("=");
    if (equals > 0 && part.slice(0, equals) === name) return decodeURIComponent(part.slice(equals + 1));
  }
  return "";
}

function cookieHeader(request, value, age) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return COOKIE_NAME + "=" + encodeURIComponent(value) + "; HttpOnly; SameSite=Lax; Path=/; Max-Age=" + age + secure;
}

function vietDate(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date || new Date());
  const values = {};
  for (const part of parts) values[part.type] = part.value;
  return values.year + "-" + values.month + "-" + values.day;
}

function shiftDate(dateText, offset) {
  const bits = dateText.split("-").map(Number);
  const date = new Date(Date.UTC(bits[0], bits[1] - 1, bits[2] + offset));
  return date.toISOString().slice(0, 10);
}

// Bộ đệm bộ nhớ thông minh (In-Memory Cache) giúp tiết kiệm 95% hạn ngạch đọc Cloudflare D1
const D1_QUERY_CACHE = new Map();
const CACHE_TTL_DEFAULT_MS = 25 * 1000; // 25s cho các truy vấn động
const CACHE_TTL_CATALOG_MS = 15 * 60 * 1000; // 15 phút cho danh mục tĩnh (môn, bài, vật phẩm)
let d1QuotaLimitHit = false;

function buildQueryCacheKey(sql, params) {
  return sql.trim() + "::" + JSON.stringify(params || []);
}

function getQueryCache(key) {
  const item = D1_QUERY_CACHE.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) return null;
  return item.data;
}

function getStaleQueryCache(key) {
  const item = D1_QUERY_CACHE.get(key);
  return item ? item.data : null;
}

function setQueryCache(key, data, ttlMs) {
  if (D1_QUERY_CACHE.size > 800) {
    const firstKey = D1_QUERY_CACHE.keys().next().value;
    D1_QUERY_CACHE.delete(firstKey);
  }
  D1_QUERY_CACHE.set(key, { data, expires: Date.now() + (ttlMs || CACHE_TTL_DEFAULT_MS) });
}

function invalidateD1QueryCache() {
  D1_QUERY_CACHE.clear();
}

async function executeFallbackDb(fallbackDb, sql, params, cacheKey, isCatalog) {
  if (!fallbackDb) return null;
  try {
    const stmt = fallbackDb.prepare(sql).bind(...params);
    const isSelect = /^\s*(SELECT|PRAGMA|WITH)/i.test(sql);
    if (isSelect) {
      const rows = await stmt.all();
      const results = rows.results || (Array.isArray(rows) ? rows : []);
      const resultObj = { results, meta: { source: "local_replica" } };
      if (cacheKey) {
        setQueryCache(cacheKey, resultObj, isCatalog ? CACHE_TTL_CATALOG_MS : CACHE_TTL_DEFAULT_MS);
      }
      return resultObj;
    } else {
      const runRes = await stmt.run();
      return { results: [], meta: runRes.meta || { changes: 1, source: "local_replica" } };
    }
  } catch (err) {
    console.error("[3TG D1 Local Replica Error]", err.message, "[SQL:", sql, "]");
    const isSelect = /^\s*(SELECT|PRAGMA|WITH)/i.test(sql);
    if (isSelect) {
      return { results: [], meta: { error: err.message, source: "local_replica" } };
    }
    throw err;
  }
}

function createRemoteD1(env, fallbackDb) {
  if (fallbackDb && fallbackDb.__isRemoteD1) {
    return fallbackDb;
  }
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const dbId = env.CLOUDFLARE_D1_DATABASE_ID;
  const token = env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !dbId || !token) {
    return fallbackDb;
  }

  const endpoint = "https://api.cloudflare.com/client/v4/accounts/" + accountId + "/d1/database/" + dbId + "/query";

  async function execute(sql, params = []) {
    const cleanParams = (params || []).map(p => {
      if (p === undefined) return null;
      if (typeof p === "boolean") return p ? 1 : 0;
      return p;
    });

    const isSelect = /^\s*(SELECT|PRAGMA|WITH)/i.test(sql);
    const isCatalog = /FROM\s+(subjects|units|shop_items|lessons|achievements)\b/i.test(sql);
    const cacheKey = buildQueryCacheKey(sql, cleanParams);

    // 1. Kiểm tra cache trong bộ nhớ trước khi gọi D1 REST API
    if (isSelect) {
      const hit = getQueryCache(cacheKey);
      if (hit) return hit;
    } else {
      // Khi có ghi/sửa/xóa, dọn dẹp cache để dữ liệu lập tức đồng bộ
      invalidateD1QueryCache();
    }

    // 2. Nếu đã biết Cloudflare D1 hết hạn ngạch ngày hôm nay, ưu tiên gọi Local D1 Replica
    if (d1QuotaLimitHit && fallbackDb) {
      const fallbackRes = await executeFallbackDb(fallbackDb, sql, cleanParams, cacheKey, isCatalog);
      if (fallbackRes) return fallbackRes;
    }

    // 3. Thực hiện truy vấn tới Cloudflare D1 Database qua REST API
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sql: sql, params: cleanParams })
      });
      const data = await res.json();

      if (!data.success) {
        const err = (data.errors && data.errors[0]) || { message: "D1 query failed" };
        const errMsg = String(err.message || JSON.stringify(err));
        const isQuota = /limit|quota|exceeded/i.test(errMsg);

        if (isQuota) {
          d1QuotaLimitHit = true;
          console.warn("[3TG D1 Quota Handler] Hạn ngạch đọc Cloudflare D1 đã đạt 5M dòng. Tự động chuyển mạch an toàn sang Local Replica & In-memory cache.");
          if (fallbackDb) {
            const fallbackRes = await executeFallbackDb(fallbackDb, sql, cleanParams, cacheKey, isCatalog);
            if (fallbackRes) return fallbackRes;
          }
          const stale = getStaleQueryCache(cacheKey);
          if (stale) return stale;
          if (isSelect) return { results: [], meta: { quota_exceeded: true } };
        }

        if (fallbackDb) {
          console.warn("[3TG D1 Error -> Fallback Local Replica]:", errMsg);
          const fallbackRes = await executeFallbackDb(fallbackDb, sql, cleanParams, cacheKey, isCatalog);
          if (fallbackRes) return fallbackRes;
        }

        throw new Error("Cloudflare D1 Error: " + errMsg + " [SQL: " + sql + "]");
      }

      const resultObj = (data.result && data.result[0]) || { results: [], meta: {} };
      if (isSelect) {
        setQueryCache(cacheKey, resultObj, isCatalog ? CACHE_TTL_CATALOG_MS : CACHE_TTL_DEFAULT_MS);
      }
      return resultObj;
    } catch (networkOrLimitErr) {
      if (fallbackDb) {
        console.warn("[3TG D1 Network/Quota Fallback to Local Replica]:", networkOrLimitErr.message);
        const fallbackRes = await executeFallbackDb(fallbackDb, sql, cleanParams, cacheKey, isCatalog);
        if (fallbackRes) return fallbackRes;
      }
      const stale = getStaleQueryCache(cacheKey);
      if (stale) return stale;
      throw networkOrLimitErr;
    }
  }

  class PreparedStatement {
    constructor(sql, params = []) {
      this.sql = sql;
      this.params = params;
    }
    bind(...args) {
      const flat = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
      return new PreparedStatement(this.sql, flat);
    }
    async first(col) {
      const res = await execute(this.sql, this.params);
      const row = (res.results && res.results[0]) || null;
      if (!row) return null;
      if (col !== undefined) return row[col];
      return row;
    }
    async all() {
      const res = await execute(this.sql, this.params);
      return { success: true, results: res.results || [], meta: res.meta || {} };
    }
    async run() {
      const res = await execute(this.sql, this.params);
      return { success: true, meta: res.meta || {} };
    }
    async raw() {
      const res = await execute(this.sql, this.params);
      return (res.results || []).map(r => Object.values(r));
    }
  }

  return {
    __isRemoteD1: true,
    prepare(sql) {
      return new PreparedStatement(sql);
    },
    async batch(statements) {
      const results = [];
      for (const stmt of statements) {
        results.push(await stmt.all());
      }
      return results;
    },
    async exec(sql) {
      return await execute(sql, []);
    }
  };
}

async function syncRemoteD1(env, sql, params = []) {
  try {
    return await env.DB.prepare(sql).bind(...params).all();
  } catch {
    return null;
  }
}

async function evaluateUserStreak(userId, db, today) {
  const stats = await db.prepare(
    "SELECT user_id, total_xp, current_streak, longest_streak, hearts, gems, last_active_date " +
    "FROM user_stats WHERE user_id = ? LIMIT 1"
  ).bind(userId).first() || {
    user_id: userId, total_xp: 0, current_streak: 0, longest_streak: 0, hearts: 5, gems: 50, last_active_date: null
  };

  const streak = Number(stats.current_streak) || 0;
  if (!stats.last_active_date) {
    if (streak !== 0) {
      await db.prepare("UPDATE user_stats SET current_streak = 0 WHERE user_id = ?").bind(userId).run();
      stats.current_streak = 0;
    }
    return stats;
  }

  const last = String(stats.last_active_date).slice(0, 10);
  const yesterday = shiftDate(today, -1);
  const twoDaysAgo = shiftDate(today, -2);
  const threeDaysAgo = shiftDate(today, -3);

  // If last was today or yesterday -> streak is safe and active!
  if (last === today || last === yesterday) {
    return stats;
  }

  // Lấy số lượng Bùa bảo vệ chuỗi trong kho
  const freeze = await db.prepare(
    "SELECT id, quantity FROM user_inventory WHERE user_id = ? AND item_code = 'streak_freeze' LIMIT 1"
  ).bind(userId).first();
  const freezeQty = Number(freeze?.quantity) || 0;

  // Trường hợp 1: Nghỉ 1 ngày (hôm qua)
  if (last === twoDaysAgo) {
    if (freezeQty >= 1) {
      // Dùng 1 bùa bảo vệ chuỗi để đóng băng hôm qua
      await db.batch([
        db.prepare("UPDATE user_inventory SET quantity = quantity - 1 WHERE id = ?").bind(freeze.id),
        db.prepare(
          "INSERT INTO user_streak_history (user_id, activity_date, status) VALUES (?, ?, 'freeze_used') " +
          "ON CONFLICT(user_id, activity_date) DO UPDATE SET status = 'freeze_used'"
        ).bind(userId, yesterday),
        db.prepare("UPDATE user_stats SET last_active_date = ? WHERE user_id = ?").bind(yesterday, userId)
      ]);
      stats.last_active_date = yesterday;
      return stats;
    } else {
      // Hết bùa bảo vệ chuỗi -> Chuỗi bị đứt về 0!
      await db.batch([
        db.prepare(
          "INSERT INTO user_streak_history (user_id, activity_date, status) VALUES (?, ?, 'missed') " +
          "ON CONFLICT(user_id, activity_date) DO UPDATE SET status = 'missed'"
        ).bind(userId, yesterday),
        db.prepare("UPDATE user_stats SET current_streak = 0 WHERE user_id = ?").bind(userId)
      ]);
      stats.current_streak = 0;
      return stats;
    }
  }

  // Trường hợp 2: Nghỉ 2 ngày liên tiếp (hôm kia và hôm qua)
  if (last === threeDaysAgo) {
    if (freezeQty >= 2) {
      // Dùng 2 bùa bảo vệ chuỗi để đóng băng cả 2 ngày
      await db.batch([
        db.prepare("UPDATE user_inventory SET quantity = quantity - 2 WHERE id = ?").bind(freeze.id),
        db.prepare(
          "INSERT INTO user_streak_history (user_id, activity_date, status) VALUES (?, ?, 'freeze_used') " +
          "ON CONFLICT(user_id, activity_date) DO UPDATE SET status = 'freeze_used'"
        ).bind(userId, twoDaysAgo),
        db.prepare(
          "INSERT INTO user_streak_history (user_id, activity_date, status) VALUES (?, ?, 'freeze_used') " +
          "ON CONFLICT(user_id, activity_date) DO UPDATE SET status = 'freeze_used'"
        ).bind(userId, yesterday),
        db.prepare("UPDATE user_stats SET last_active_date = ? WHERE user_id = ?").bind(yesterday, userId)
      ]);
      stats.last_active_date = yesterday;
      return stats;
    } else {
      // Không đủ 2 bùa bảo vệ -> Chuỗi bị đứt về 0!
      await db.prepare("UPDATE user_stats SET current_streak = 0 WHERE user_id = ?").bind(userId).run();
      stats.current_streak = 0;
      return stats;
    }
  }

  // Trường hợp 3: Quá 2 ngày không học (từ ngày thứ 3 trở đi) -> Chuỗi bị đứt về 0!
  if (streak !== 0) {
    await db.prepare("UPDATE user_stats SET current_streak = 0 WHERE user_id = ?").bind(userId).run();
    stats.current_streak = 0;
  }
  return stats;
}

async function sessionUser(request, env) {
  const userId = getCookie(request, COOKIE_NAME);
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return null;
  const account = await env.DB.prepare(
    "SELECT a.id AS account_id, a.username, a.created_at AS account_created_at, p.id AS profile_id, p.full_name, p.avatar_url, p.bio, p.cover_url, p.school, p.major, p.created_at AS profile_created_at " +
    "FROM accounts a LEFT JOIN profiles p ON p.user_id = a.user_id " +
    "WHERE a.user_id = ? LIMIT 1"
  ).bind(userId).first();
  if (!account) return null;
  const profile = {
    id: account.profile_id || account.account_id,
    user_id: userId,
    full_name: account.full_name || account.username,
    avatar_url: account.avatar_url,
    bio: account.bio || "",
    cover_url: account.cover_url || "",
    school: account.school || "",
    major: account.major || "",
    created_at: account.profile_created_at || account.account_created_at || "",
    username: account.username
  };
  return { userId: userId, account: account, profile: profile };
}

async function requireUser(request, env) {
  const user = await sessionUser(request, env);
  if (!user) throw new HttpError(401, "Hồ sơ đã hết phiên. Hãy mở lại góc học tập.");
  return user;
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Dữ liệu gửi lên chưa đúng định dạng.");
  }
}

function parseOptions(value) {
  let data = value;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = [];
    }
  }
  if (Array.isArray(data)) {
    return data.map(function (item, index) {
      const fallback = String.fromCharCode(65 + index);
      if (item && typeof item === "object") {
        const label = normalizeAnswer(item.label || item.key || item.id || fallback);
        const text = item.text || item.value || item.content || item.answer || "";
        return { key: label, text: String(text) };
      }
      return { key: fallback, text: String(item) };
    });
  }
  if (data && typeof data === "object") {
    return Object.entries(data).map(function (entry) {
      const item = entry[1];
      if (item && typeof item === "object") {
        return { key: normalizeAnswer(entry[0]), text: String(item.text || item.value || item.content || "") };
      }
      return { key: normalizeAnswer(entry[0]), text: String(item) };
    });
  }
  return [];
}

function normalizeAnswer(value) {
  return String(value == null ? "" : value).trim().replace(/^[[(]\s*|\s*[)\].]$/g, "").toUpperCase();
}

function normalizedText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getSearchTerms(value) {
  const ignored = new Set(["minh", "ban", "cho", "voi", "mot", "nhung", "trong", "nay", "giup", "ve", "cac", "cua", "theo", "la", "gi", "sao", "tai", "nhu", "dung", "hay", "please", "about", "what", "how", "with", "from", "this", "that"]);
  return Array.from(new Set(String(value || "")
    .toLocaleLowerCase("vi-VN")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(function (word) { return word.length > 2 && !ignored.has(normalizedText(word)); })))
    .slice(0, 5);
}

async function courseSnippets(env, subjectName, question) {
  const terms = getSearchTerms(question);
  const excerpts = [];
  const variants = function (term) {
    return [
      term,
      term.charAt(0).toLocaleUpperCase("vi-VN") + term.slice(1),
      term.toLocaleUpperCase("vi-VN")
    ];
  };
  for (const term of terms) {
    const forms = variants(term);
    const row = await env.DB.prepare(
      "SELECT CASE WHEN instr(content, ?) > 0 THEN substr(content, max(1, instr(content, ?) - 520), 1250) " +
      "WHEN instr(content, ?) > 0 THEN substr(content, max(1, instr(content, ?) - 520), 1250) " +
      "ELSE substr(content, max(1, instr(content, ?) - 520), 1250) END AS excerpt " +
      "FROM subject_data WHERE subject_name = ? AND (instr(content, ?) > 0 OR instr(content, ?) > 0 OR instr(content, ?) > 0) " +
      "ORDER BY created_at DESC LIMIT 1"
    ).bind(forms[0], forms[0], forms[1], forms[1], forms[2], subjectName, forms[0], forms[1], forms[2]).first();
    if (row && row.excerpt) excerpts.push(String(row.excerpt));
  }
  if (!excerpts.length) {
    const fallback = await env.DB.prepare(
      "SELECT substr(content, 1, 5000) AS excerpt FROM subject_data WHERE subject_name = ? ORDER BY created_at DESC LIMIT 1"
    ).bind(subjectName).first();
    if (fallback && fallback.excerpt) excerpts.push(String(fallback.excerpt));
  }
  const source = Array.from(new Set(excerpts))
    .join("\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!source) return "";
  const fragments = source.split(/(?<=[.!?])\s+|(?:\s*[—–]\s*)/).filter(function (part) {
    return part.trim().length > 35;
  });
  const scored = fragments.map(function (fragment, index) {
    const normalized = normalizedText(fragment);
    let score = 0;
    for (const term of terms) if (normalized.includes(normalizedText(term))) score += 1;
    return { text: fragment.trim(), score: score, index: index };
  }).filter(function (item) { return item.score > 0; });
  scored.sort(function (a, b) { return b.score - a.score || a.index - b.index; });
  let selected = scored.slice(0, 6).map(function (item) { return item.text; });
  if (!selected.length) selected = fragments.slice(0, 4).map(function (part) { return part.trim(); });
  let output = "";
  for (const item of selected) {
    const next = item.slice(0, 1400);
    if ((output.length + next.length) > 6200) continue;
    output += (output ? "\n\n" : "") + next;
  }
  return output;
}

async function apiSubjects(env) {
  const result = await env.DB.prepare(
    "SELECT s.id, s.subject_name, s.description, s.icon_url, " +
    "COALESCE(u.unit_count, 0) AS unit_count, " +
    "COALESCE(l.lesson_count, 0) AS lesson_count " +
    "FROM subjects s " +
    "LEFT JOIN (SELECT subject_id, COUNT(*) AS unit_count FROM units GROUP BY subject_id) u ON u.subject_id = s.id " +
    "LEFT JOIN (SELECT u2.subject_id, COUNT(*) AS lesson_count FROM lessons l2 JOIN units u2 ON u2.id = l2.unit_id GROUP BY u2.subject_id) l ON l.subject_id = s.id " +
    "ORDER BY s.id"
  ).all();
  return result.results || [];
}

async function overview(user, env) {
  const today = vietDate();
  const stats = await evaluateUserStreak(user.userId, env.DB, today);
  stats.hearts = 999;

  const results = await Promise.all([
    apiSubjects(env),
    env.DB.prepare(
      "SELECT COUNT(DISTINCT lesson_id) AS completed_count FROM user_progress WHERE user_id = ? AND status = 'completed'"
    ).bind(user.userId).first(),
    env.DB.prepare(
      "SELECT subject_id, COUNT(DISTINCT lesson_id) AS completed_count FROM user_progress p " +
      "JOIN lessons l ON l.id = p.lesson_id JOIN units u ON u.id = l.unit_id " +
      "WHERE p.user_id = ? AND p.status = 'completed' GROUP BY subject_id"
    ).bind(user.userId).all(),
    env.DB.prepare(
      "SELECT p.id, p.lesson_id, p.score, p.completed_at, l.title AS lesson_title " +
      "FROM user_progress p JOIN lessons l ON l.id = p.lesson_id " +
      "WHERE p.user_id = ? AND p.status = 'completed' ORDER BY p.completed_at DESC, p.id DESC LIMIT 4"
    ).bind(user.userId).all(),
    env.DB.prepare(
      "SELECT activity_date, status FROM user_streak_history WHERE user_id = ? AND activity_date >= ? ORDER BY activity_date DESC"
    ).bind(user.userId, shiftDate(today, -29)).all(),
    env.DB.prepare(
      "SELECT COUNT(DISTINCT lesson_id) AS today_count FROM user_progress " +
      "WHERE user_id = ? AND status = 'completed' AND date(completed_at, '+7 hours') = ?"
    ).bind(user.userId, today).first(),
    env.DB.prepare("SELECT item_code, quantity FROM user_inventory WHERE user_id = ?").bind(user.userId).all(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM user_achievements WHERE user_id = ?").bind(user.userId).first(),
    env.DB.prepare("SELECT league_name FROM weekly_leaderboards WHERE user_id = ? AND week_start_date = ? LIMIT 1").bind(user.userId, mondayDate(today)).first()
  ]);

  const completedBySubject = {};
  for (const row of (results[2].results || [])) completedBySubject[row.subject_id] = Number(row.completed_count) || 0;
  return {
    profile: user.profile,
    stats: stats,
    completedCount: Number(results[1] && results[1].completed_count) || 0,
    inventory: results[6] && results[6].results ? results[6].results : [],
    achievementsCount: Number(results[7] && results[7].count) || 0,
    league: (results[8] && results[8].league_name) || "Bronze",
    subjects: (results[0] || []).map(function (subject) {
      const done = completedBySubject[subject.id] || 0;
      return Object.assign({}, subject, {
        completed_count: done,
        progress_percent: subject.lesson_count ? Math.round(done * 100 / Number(subject.lesson_count)) : 0
      });
    }),
    recent: results[3].results || [],
    week: results[4].results || [],
    today: today,
    todayCount: Number(results[5] && results[5].today_count) || 0,
    settings: DEFAULT_SETTINGS
  };
}

async function subjectDetails(subjectId, userId, env) {
  const rows = await env.DB.prepare(
    "SELECT s.id AS subject_id, s.subject_name, s.description, s.icon_url, " +
    "u.id AS unit_id, u.title AS unit_title, u.order_index AS unit_order, " +
    "l.id AS lesson_id, l.title AS lesson_title, l.order_index AS lesson_order, l.xp_reward, " +
    "p.status AS progress_status " +
    "FROM subjects s LEFT JOIN units u ON u.subject_id = s.id " +
    "LEFT JOIN lessons l ON l.unit_id = u.id " +
    "LEFT JOIN user_progress p ON p.lesson_id = l.id AND p.user_id = ? AND p.status = 'completed' " +
    "WHERE s.id = ? " +
    "ORDER BY u.order_index, u.id, l.order_index, l.id"
  ).bind(userId, subjectId).all();
  const records = rows.results || [];
  if (!records.length) throw new HttpError(404, "Không tìm thấy môn học này.");
  const first = records[0];
  const units = [];
  const lessonState = new Map();
  for (const row of records) {
    if (row.unit_id == null) continue;
    let unit = units[units.length - 1];
    if (!unit || Number(unit.id) !== Number(row.unit_id)) {
      unit = { id: row.unit_id, title: row.unit_title, order_index: row.unit_order, lessons: [] };
      units.push(unit);
    }
    if (row.lesson_id != null) {
      const lesson = {
        id: row.lesson_id, title: row.lesson_title, order_index: row.lesson_order,
        xp_reward: Number(row.xp_reward) || 10, completed: row.progress_status === "completed"
      };
      unit.lessons.push(lesson);
      lessonState.set(String(lesson.id), lesson);
    }
  }
  let previousCompleted = true;
  for (const unit of units) {
    for (const lesson of unit.lessons) {
      lesson.unlocked = lesson.completed || previousCompleted;
      previousCompleted = lesson.completed;
    }
  }
  return {
    subject: {
      id: first.subject_id, subject_name: first.subject_name,
      description: first.description, icon_url: first.icon_url
    },
    units: units
  };
}

async function lessonData(lessonId, userId, env) {
  const lesson = await env.DB.prepare(
    "SELECT l.id, l.unit_id, l.title, l.order_index, l.xp_reward, l.content, l.video_url, " +
    "u.title AS unit_title, s.id AS subject_id, s.subject_name " +
    "FROM lessons l JOIN units u ON u.id = l.unit_id JOIN subjects s ON s.id = u.subject_id WHERE l.id = ?"
  ).bind(lessonId).first();
  if (!lesson) throw new HttpError(404, "Không tìm thấy bài học này.");
  if (!await lessonIsUnlocked(lessonId, userId, env)) {
    throw new HttpError(423, "Hoàn thành bài trước để mở khóa bài này nhé.");
  }
  let query = await env.DB.prepare(
    "SELECT id, question_type, question_text, options FROM questions WHERE lesson_id = ? ORDER BY id"
  ).bind(lessonId).all();
  let questionRows = query.results || [];

  // Fallback to real questions in the same unit if this slide has no direct questions attached
  if (!questionRows.length) {
    const unitQuery = await env.DB.prepare(
      "SELECT id, question_type, question_text, options FROM questions " +
      "WHERE lesson_id IN (SELECT id FROM lessons WHERE unit_id = ?) " +
      "ORDER BY ABS(lesson_id - ?) LIMIT 5"
    ).bind(lesson.unit_id, lessonId).all();
    questionRows = unitQuery.results || [];
  }
  // Fallback to subject if the unit has no questions
  if (!questionRows.length) {
    const subQuery = await env.DB.prepare(
      "SELECT id, question_type, question_text, options FROM questions " +
      "WHERE lesson_id IN (SELECT l2.id FROM lessons l2 JOIN units u2 ON u2.id = l2.unit_id WHERE u2.subject_id = ?) " +
      "ORDER BY id LIMIT 5"
    ).bind(lesson.subject_id).all();
    questionRows = subQuery.results || [];
  }

  return {
    lesson: lesson,
    questions: questionRows.map(function (row) {
      return {
        id: row.id, question_type: row.question_type, question_text: row.question_text,
        options: parseOptions(row.options)
      };
    })
  };
}

async function lessonIsUnlocked(lessonId, userId, env) {
  const unlocked = await env.DB.prepare(
    "WITH current_lesson AS (" +
      "SELECT l.id, l.order_index AS lesson_order, u.id AS unit_id, u.order_index AS unit_order, u.subject_id " +
      "FROM lessons l JOIN units u ON u.id = l.unit_id WHERE l.id = ?" +
    "), previous_lesson AS (" +
      "SELECT prior.id FROM current_lesson current_row " +
      "JOIN units prior_unit ON prior_unit.subject_id = current_row.subject_id " +
      "JOIN lessons prior ON prior.unit_id = prior_unit.id " +
      "WHERE prior_unit.order_index < current_row.unit_order " +
        "OR (prior_unit.order_index = current_row.unit_order AND prior_unit.id < current_row.unit_id) " +
        "OR (prior_unit.order_index = current_row.unit_order AND prior_unit.id = current_row.unit_id AND prior.order_index < current_row.lesson_order) " +
        "OR (prior_unit.order_index = current_row.unit_order AND prior_unit.id = current_row.unit_id AND prior.order_index = current_row.lesson_order AND prior.id < current_row.id) " +
      "ORDER BY prior_unit.order_index DESC, prior_unit.id DESC, prior.order_index DESC, prior.id DESC LIMIT 1" +
    ") " +
    "SELECT current_row.id FROM current_lesson current_row WHERE " +
      "EXISTS (SELECT 1 FROM user_progress completed WHERE completed.user_id = ? AND completed.lesson_id = current_row.id AND completed.status = 'completed') " +
      "OR NOT EXISTS (SELECT 1 FROM previous_lesson) " +
      "OR EXISTS (SELECT 1 FROM previous_lesson previous JOIN user_progress progress ON progress.lesson_id = previous.id " +
        "WHERE progress.user_id = ? AND progress.status = 'completed') LIMIT 1"
  ).bind(lessonId, userId, userId).first();
  return Boolean(unlocked);
}

async function submitLesson(request, lessonId, user, env) {
  const body = await readJson(request);
  let submitted = Array.isArray(body.answers) ? body.answers : [];
  const lesson = await env.DB.prepare(
    "SELECT id, unit_id, xp_reward FROM lessons WHERE id = ?"
  ).bind(lessonId).first();
  if (!lesson) throw new HttpError(404, "Không tìm thấy bài học này.");
  if (!await lessonIsUnlocked(lessonId, user.userId, env)) {
    throw new HttpError(423, "Hoàn thành bài trước để mở khóa bài này nhé.");
  }
  let rows = [];
  if (submitted.length > 0) {
    const qIds = submitted.map(function (a) { return a.questionId; }).filter(Boolean);
    if (qIds.length > 0) {
      const placeholders = qIds.map(function () { return "?"; }).join(",");
      const qRes = await env.DB.prepare(
        "SELECT id, correct_answer, explanation FROM questions WHERE id IN (" + placeholders + ")"
      ).bind(...qIds).all();
      rows = qRes.results || [];
    }
  }
  if (!rows.length) {
    const questions = await env.DB.prepare(
      "SELECT id, correct_answer, explanation FROM questions WHERE lesson_id = ? ORDER BY id"
    ).bind(lessonId).all();
    rows = questions.results || [];
  }
  if (!rows.length) {
    const unitQ = await env.DB.prepare(
      "SELECT id, correct_answer, explanation FROM questions WHERE lesson_id IN (SELECT id FROM lessons WHERE unit_id = ?) ORDER BY ABS(lesson_id - ?) LIMIT 5"
    ).bind(lesson.unit_id, lessonId).all();
    rows = unitQ.results || [];
  }
  let isDirectSlide = false;
  if (!rows.length) {
    isDirectSlide = true;
    rows = [{ id: 0, correct_answer: "A", explanation: "Bài học đã hoàn thành." }];
    submitted = [{ questionId: 0, selected: "A" }];
  }

  const answersById = new Map(submitted.map(function (answer) {
    return [String(answer.questionId), normalizeAnswer(answer.selected)];
  }));
  const resultRows = isDirectSlide ? [] : rows.map(function (question) {
    const selected = answersById.get(String(question.id)) || "";
    return {
      id: question.id,
      selected: selected,
      correct_answer: normalizeAnswer(question.correct_answer),
      is_correct: selected !== "" && selected === normalizeAnswer(question.correct_answer),
      explanation: question.explanation || ""
    };
  });
  const correct = isDirectSlide ? 1 : resultRows.filter(function (row) { return row.is_correct; }).length;
  const total = rows.length;
  const score = isDirectSlide ? 100 : Math.round(correct * 100 / total);
  const today = vietDate();
  const yesterday = shiftDate(today, -1);
  const twoDaysAgo = shiftDate(today, -2);
  const threeDaysAgo = shiftDate(today, -3);

  const stats = await env.DB.prepare(
    "SELECT total_xp, current_streak, longest_streak, hearts, gems, last_active_date " +
    "FROM user_stats WHERE user_id = ? LIMIT 1"
  ).bind(user.userId).first() || { total_xp: 0, current_streak: 0, longest_streak: 0, hearts: 5, gems: 0 };
  const prior = await env.DB.prepare(
    "SELECT id, status FROM user_progress WHERE user_id = ? AND lesson_id = ? ORDER BY id DESC LIMIT 1"
  ).bind(user.userId, lessonId).first();
  const firstCompletion = !prior || prior.status !== "completed";
  const reward = firstCompletion && correct > 0
    ? Math.max(1, Math.round((Number(lesson.xp_reward) || 10) * correct / total))
    : 0;
  const gemReward = firstCompletion ? (score >= 80 ? 5 : 2) : 1;
  const hearts = 999; // Vô hạn tim vĩnh viễn (không bao giờ trừ tim)

  let streak = Number(stats.current_streak) || 0;
  let longest = Number(stats.longest_streak) || 0;
  let freezeId = null;

  const last = stats.last_active_date ? String(stats.last_active_date).slice(0, 10) : null;
  if (!last) {
    streak = 1;
  } else if (last === today) {
    // Đã học hôm nay -> giữ nguyên chuỗi
    streak = Math.max(1, streak);
  } else if (last === yesterday) {
    // Hôm qua đã học -> ngày mới lên chuỗi!
    streak = streak + 1;
  } else if (last === twoDaysAgo) {
    // Cách 1 ngày -> kiểm tra bảo vệ chuỗi
    const freezeRow = await env.DB.prepare(
      "SELECT id FROM user_streak_history WHERE user_id = ? AND activity_date = ? AND status = 'freeze_used' LIMIT 1"
    ).bind(user.userId, yesterday).first();

    if (freezeRow) {
      streak = streak + 1;
    } else {
      const invFreeze = await env.DB.prepare(
        "SELECT id, quantity FROM user_inventory WHERE user_id = ? AND item_code = 'streak_freeze' AND quantity > 0 LIMIT 1"
      ).bind(user.userId).first();

      if (invFreeze) {
        freezeId = invFreeze.id;
        streak = streak + 1;
      } else {
        streak = 1; // Hủy chuỗi cũ, bắt đầu chuỗi mới
      }
    }
  } else if (last === threeDaysAgo) {
    // Cách 2 ngày (hôm kia và hôm qua) -> kiểm tra cả 2 ngày đã được đóng băng chuỗi chưa
    const freezes = await env.DB.prepare(
      "SELECT activity_date FROM user_streak_history WHERE user_id = ? AND activity_date IN (?, ?) AND status = 'freeze_used'"
    ).bind(user.userId, twoDaysAgo, yesterday).all();

    if ((freezes.results || []).length >= 2) {
      streak = streak + 1;
    } else {
      streak = 1;
    }
  } else {
    // Quá 2 ngày không học -> chuỗi đã mất, bắt đầu chuỗi mới từ 1
    streak = 1;
  }
  longest = Math.max(longest, streak);

  const now = new Date().toISOString();
  const operations = [];
  if (prior) {
    operations.push(env.DB.prepare(
      "UPDATE user_progress SET status = 'completed', score = MAX(score, ?), completed_at = COALESCE(completed_at, ?) WHERE id = ?"
    ).bind(score, now, prior.id));
  } else {
    operations.push(env.DB.prepare(
      "INSERT INTO user_progress (user_id, lesson_id, status, score, completed_at) VALUES (?, ?, 'completed', ?, ?)"
    ).bind(user.userId, lessonId, score, now));
  }
  operations.push(env.DB.prepare(
    "UPDATE user_stats SET total_xp = total_xp + ?, current_streak = ?, longest_streak = ?, hearts = ?, gems = gems + ?, last_active_date = ? WHERE user_id = ?"
  ).bind(reward, streak, longest, hearts, gemReward, today, user.userId));
  operations.push(env.DB.prepare(
    "INSERT INTO user_streak_history (user_id, activity_date, status) VALUES (?, ?, 'completed') " +
    "ON CONFLICT(user_id, activity_date) DO UPDATE SET status = 'completed'"
  ).bind(user.userId, today));

  if (freezeId != null) {
    operations.push(env.DB.prepare("UPDATE user_inventory SET quantity = quantity - 1 WHERE id = ?").bind(freezeId));
    operations.push(env.DB.prepare(
      "INSERT INTO user_streak_history (user_id, activity_date, status) VALUES (?, ?, 'freeze_used') " +
      "ON CONFLICT(user_id, activity_date) DO UPDATE SET status = 'freeze_used'"
    ).bind(user.userId, yesterday));
  }
  if (!isDirectSlide && resultRows.length) {
    const questionIds = resultRows.map(function (row) { return row.id; });
    const placeholders = questionIds.map(function () { return "?"; }).join(",");
    const oldRows = await env.DB.prepare(
      "SELECT id, question_id FROM user_mistakes WHERE user_id = ? AND question_id IN (" + placeholders + ")"
    ).bind(user.userId, ...questionIds).all();
    const oldByQuestion = new Map((oldRows.results || []).map(function (row) { return [String(row.question_id), row.id]; }));
    for (const answer of resultRows) {
      const mistakeId = oldByQuestion.get(String(answer.id));
      if (mistakeId) {
        if (answer.is_correct) {
          operations.push(env.DB.prepare("UPDATE user_mistakes SET is_mastered = 1 WHERE id = ?").bind(mistakeId));
        } else {
          operations.push(env.DB.prepare(
            "UPDATE user_mistakes SET wrong_count = wrong_count + 1, last_wrong_at = ?, is_mastered = 0 WHERE id = ?"
          ).bind(now, mistakeId));
        }
      } else if (!answer.is_correct) {
        operations.push(env.DB.prepare(
          "INSERT INTO user_mistakes (user_id, question_id, wrong_count, last_wrong_at, is_mastered) VALUES (?, ?, 1, ?, 0)"
        ).bind(user.userId, answer.id, now));
      }
    }
  }
  operations.push(env.DB.prepare(
    "INSERT OR IGNORE INTO weekly_leaderboards (user_id, league_name, weekly_xp, week_start_date) VALUES (?, 'Bronze', 0, ?)"
  ).bind(user.userId, mondayDate(today)));
  if (reward) {
    operations.push(env.DB.prepare(
      "UPDATE weekly_leaderboards SET weekly_xp = weekly_xp + ? WHERE user_id = ? AND week_start_date = ?"
    ).bind(reward, user.userId, mondayDate(today)));
  }
  await env.DB.batch(operations);
  await checkAndUnlockAchievements(user.userId, env);

  const updatedStats = Object.assign({}, stats, {
    total_xp: (Number(stats.total_xp) || 0) + reward,
    current_streak: streak,
    longest_streak: longest,
    hearts: hearts,
    gems: (Number(stats.gems) || 0) + gemReward,
    last_active_date: today
  });
  return {
    score: score, correct: correct, total: total, xpAwarded: reward, gemsAwarded: gemReward,
    results: resultRows, stats: updatedStats, isFirstCompletion: firstCompletion
  };
}

function mondayDate(dateText) {
  const parts = dateText.split("-").map(Number);
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const weekday = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() + (weekday === 0 ? -6 : 1 - weekday));
  return date.toISOString().slice(0, 10);
}

async function updateProfile(request, user, env) {
  const body = await readJson(request);
  const fullName = String(body.fullName || user.profile.full_name || "").trim().replace(/\s+/g, " ").slice(0, 50);
  const bio = String(body.bio != null ? body.bio : (user.profile.bio || "")).trim().slice(0, 160);
  const school = String(body.school != null ? body.school : (user.profile.school || "")).trim().slice(0, 100);
  const major = String(body.major != null ? body.major : (user.profile.major || "")).trim().slice(0, 100);
  if (!fullName) throw new HttpError(400, "Nhập tên hiển thị trước khi lưu nhé.");
  await env.DB.prepare("UPDATE profiles SET full_name = ?, bio = ?, school = ?, major = ? WHERE user_id = ?")
    .bind(fullName, bio, school, major, user.userId).run();
  return Object.assign({}, user.profile, { full_name: fullName, bio: bio, school: school, major: major });
}

async function setPresetAvatar(request, user, env) {
  const body = await readJson(request);
  const avatarUrl = String(body.avatarUrl || "").trim();
  if (!avatarUrl) throw new HttpError(400, "Chọn một hình đại diện.");
  await env.DB.prepare("UPDATE profiles SET avatar_url = ? WHERE user_id = ?").bind(avatarUrl, user.userId).run();
  return Object.assign({}, user.profile, { avatar_url: avatarUrl });
}

async function updateCover(request, user, env) {
  const body = await readJson(request);
  const coverUrl = String(body.coverUrl || "").trim();
  if (!coverUrl) throw new HttpError(400, "Chọn một ảnh bìa.");
  await env.DB.prepare("UPDATE profiles SET cover_url = ? WHERE user_id = ?").bind(coverUrl, user.userId).run();
  return Object.assign({}, user.profile, { cover_url: coverUrl });
}

async function uploadAvatar(request, user, env) {
  let form;
  try {
    form = await request.formData();
  } catch {
    throw new HttpError(400, "Không đọc được ảnh tải lên.");
  }
  const file = form.get("avatar");
  if (!file || typeof file.arrayBuffer !== "function") throw new HttpError(400, "Chọn ảnh đại diện trước khi tải lên.");
  if (file.size > 4 * 1024 * 1024) throw new HttpError(413, "Ảnh đại diện cần nhỏ hơn 4 MB.");
  const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const extension = extensions[file.type];
  if (!extension) throw new HttpError(415, "Ảnh cần có định dạng JPG, PNG hoặc WebP.");
  const imageBytes = new Uint8Array(await file.arrayBuffer());
  const isJpeg = imageBytes[0] === 0xff && imageBytes[1] === 0xd8 && imageBytes[2] === 0xff;
  const isPng = imageBytes[0] === 0x89 && imageBytes[1] === 0x50 && imageBytes[2] === 0x4e &&
    imageBytes[3] === 0x47 && imageBytes[4] === 0x0d && imageBytes[5] === 0x0a &&
    imageBytes[6] === 0x1a && imageBytes[7] === 0x0a;
  const isWebp = imageBytes[0] === 0x52 && imageBytes[1] === 0x49 && imageBytes[2] === 0x46 &&
    imageBytes[3] === 0x46 && imageBytes[8] === 0x57 && imageBytes[9] === 0x45 &&
    imageBytes[10] === 0x42 && imageBytes[11] === 0x50;
  if ((file.type === "image/jpeg" && !isJpeg) || (file.type === "image/png" && !isPng) ||
      (file.type === "image/webp" && !isWebp)) {
    throw new HttpError(415, "Tệp này không khớp định dạng ảnh đã chọn.");
  }
  
  let avatarUrl = "";
  if (env.AVATARS) {
    const key = "avatars/" + user.userId + "/" + crypto.randomUUID() + "." + extension;
    await env.AVATARS.put(key, imageBytes, {
      httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" }
    });
    avatarUrl = "/media/" + key;
    const oldUrl = user.profile.avatar_url;
    if (oldUrl && oldUrl.startsWith("/media/avatars/" + user.userId + "/")) {
      const oldKey = oldUrl.slice("/media/".length);
      if (oldKey !== key) await env.AVATARS.delete(oldKey);
    }
  } else {
    // Fallback data URI
    let binary = "";
    const len = imageBytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(imageBytes[i]);
    avatarUrl = "data:" + file.type + ";base64," + btoa(binary);
  }

  await env.DB.prepare("UPDATE profiles SET avatar_url = ? WHERE user_id = ?")
    .bind(avatarUrl, user.userId).run();
  return Object.assign({}, user.profile, { avatar_url: avatarUrl });
}

async function removeAvatar(user, env) {
  const oldUrl = user.profile.avatar_url;
  await env.DB.prepare("UPDATE profiles SET avatar_url = NULL WHERE user_id = ?").bind(user.userId).run();
  if (oldUrl && oldUrl.startsWith("/media/avatars/" + user.userId + "/") && env.AVATARS) {
    await env.AVATARS.delete(oldUrl.slice("/media/".length));
  }
  return { ok: true };
}

async function serveMedia(path, env) {
  if (!env.AVATARS) return new Response("Not found", { status: 404 });
  let key;
  try {
    key = decodeURIComponent(path.slice("/media/".length));
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (!key.startsWith("avatars/") || key.includes("..") || key.includes("\\")) {
    return new Response("Not found", { status: 404 });
  }
  const object = await env.AVATARS.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers: headers });
}

async function reviewList(user, env) {
  const response = await env.DB.prepare(
    "SELECT m.id, m.wrong_count, m.last_wrong_at, " +
    "q.id AS question_id, q.question_type, q.question_text, q.options, q.correct_answer, q.explanation, q.lesson_id, " +
    "l.title AS lesson_title, s.id AS subject_id, s.subject_name " +
    "FROM user_mistakes m JOIN questions q ON q.id = m.question_id " +
    "JOIN lessons l ON l.id = q.lesson_id JOIN units u ON u.id = l.unit_id JOIN subjects s ON s.id = u.subject_id " +
    "WHERE m.user_id = ? AND m.is_mastered = 0 " +
    "ORDER BY s.id ASC, m.wrong_count DESC, m.last_wrong_at DESC LIMIT 100"
  ).bind(user.userId).all();
  return (response.results || []).map(row => ({
    ...row,
    options: parseOptions(row.options)
  }));
}

async function listNotes(request, user, env) {
  const url = new URL(request.url);
  const subjectId = Number(url.searchParams.get("subjectId")) || null;
  const lessonId = Number(url.searchParams.get("lessonId")) || null;
  const query = String(url.searchParams.get("q") || "").trim().slice(0, 120);
  const where = ["n.user_id = ?"];
  const params = [user.userId];
  if (subjectId) { where.push("n.subject_id = ?"); params.push(subjectId); }
  if (lessonId) { where.push("n.lesson_id = ?"); params.push(lessonId); }
  if (query) {
    where.push("(n.title LIKE ? OR n.content LIKE ?)");
    params.push("%" + query + "%", "%" + query + "%");
  }
  const result = await env.DB.prepare(
    "SELECT n.id, n.subject_id, n.lesson_id, n.title, n.content, n.created_at, n.updated_at, " +
    "s.subject_name, l.title AS lesson_title FROM user_notes n " +
    "LEFT JOIN subjects s ON s.id = n.subject_id LEFT JOIN lessons l ON l.id = n.lesson_id " +
    "WHERE " + where.join(" AND ") + " ORDER BY n.updated_at DESC, n.id DESC LIMIT 200"
  ).bind(...params).all();
  return { notes: result.results || [] };
}

async function saveNote(request, user, env, noteId) {
  const body = await readJson(request);
  const title = String(body.title || "").trim().slice(0, 160);
  const content = String(body.content || "").slice(0, 30000);
  let subjectId = body.subjectId == null || body.subjectId === "" ? null : Number(body.subjectId);
  const lessonId = body.lessonId == null || body.lessonId === "" ? null : Number(body.lessonId);
  if (!title) throw new HttpError(400, "Đặt tiêu đề cho ghi chú trước nhé.");
  if (subjectId != null && (!Number.isInteger(subjectId) || subjectId < 1)) throw new HttpError(400, "Môn học chưa hợp lệ.");
  if (lessonId != null && (!Number.isInteger(lessonId) || lessonId < 1)) throw new HttpError(400, "Bài học chưa hợp lệ.");
  if (lessonId != null) {
    const lesson = await env.DB.prepare(
      "SELECT l.id, u.subject_id FROM lessons l JOIN units u ON u.id = l.unit_id WHERE l.id = ? LIMIT 1"
    ).bind(lessonId).first();
    if (!lesson) throw new HttpError(404, "Không tìm thấy bài học này.");
    if (subjectId != null && Number(lesson.subject_id) !== subjectId) throw new HttpError(400, "Bài học không thuộc môn đã chọn.");
    if (subjectId == null) subjectId = Number(lesson.subject_id);
  }
  const now = new Date().toISOString();
  if (noteId != null) {
    const existing = await env.DB.prepare("SELECT id FROM user_notes WHERE id = ? AND user_id = ? LIMIT 1").bind(noteId, user.userId).first();
    if (!existing) throw new HttpError(404, "Không tìm thấy ghi chú này.");
    await env.DB.prepare(
      "UPDATE user_notes SET subject_id = ?, lesson_id = ?, title = ?, content = ?, updated_at = ? WHERE id = ? AND user_id = ?"
    ).bind(subjectId, lessonId, title, content, now, noteId, user.userId).run();
  } else {
    const inserted = await env.DB.prepare(
      "INSERT INTO user_notes (user_id, subject_id, lesson_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id"
    ).bind(user.userId, subjectId, lessonId, title, content, now, now).first();
    noteId = inserted && inserted.id;
  }
  const saved = await env.DB.prepare(
    "SELECT n.id, n.subject_id, n.lesson_id, n.title, n.content, n.created_at, n.updated_at, " +
    "s.subject_name, l.title AS lesson_title FROM user_notes n " +
    "LEFT JOIN subjects s ON s.id = n.subject_id LEFT JOIN lessons l ON l.id = n.lesson_id " +
    "WHERE n.id = ? AND n.user_id = ? LIMIT 1"
  ).bind(noteId, user.userId).first();
  return { note: saved };
}

async function deleteNote(noteId, user, env) {
  const result = await env.DB.prepare("DELETE FROM user_notes WHERE id = ? AND user_id = ?").bind(noteId, user.userId).run();
  if (!result.meta || !result.meta.changes) throw new HttpError(404, "Không tìm thấy ghi chú này.");
  return { ok: true };
}

async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(String(password) + "_lumi_salt_duo");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(function (b) {
    return b.toString(16).padStart(2, "0");
  }).join("");
}

async function registerAccount(request, env) {
  const body = await readJson(request);
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  const fullName = String(body.fullName || "").trim().replace(/\s+/g, " ").slice(0, 50);

  if (!username || username.length < 3 || username.length > 30 || !/^[a-z0-9_.-]+$/.test(username)) {
    throw new HttpError(400, "Tên đăng nhập từ 3 đến 30 ký tự, chỉ gồm chữ thường, số, dấu gạch dưới.");
  }
  if (!password || password.length < 6) {
    throw new HttpError(400, "Mật khẩu phải từ 6 ký tự trở lên.");
  }
  if (!fullName) {
    throw new HttpError(400, "Vui lòng nhập họ và tên của bạn.");
  }

  const existingAccount = await env.DB.prepare(
    "SELECT id FROM accounts WHERE username = ? LIMIT 1"
  ).bind(username).first();
  if (existingAccount) {
    throw new HttpError(409, "Tên đăng nhập này đã được sử dụng. Hãy chọn tên khác nhé.");
  }

  // Luôn tạo userId hoàn toàn mới cho tài khoản đăng ký mới để thông tin trang cá nhân luôn trống và sạch sẽ
  const userId = crypto.randomUUID();
  const encryptedPassword = await hashPassword(password);
  const accountId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const profileId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const today = vietDate();
  const weekStart = mondayDate(today);

  const ops = [
    env.DB.prepare(
      "INSERT INTO accounts (id, user_id, service_name, username, encrypted_password, created_at) VALUES (?, ?, 'local', ?, ?, ?)"
    ).bind(accountId, userId, username, encryptedPassword, today),
    env.DB.prepare(
      "INSERT INTO profiles (id, user_id, full_name, avatar_url, bio, cover_url, school, major, created_at) VALUES (?, ?, ?, NULL, '', NULL, '', '', ?)"
    ).bind(profileId, userId, fullName, today),
    env.DB.prepare(
      "INSERT OR IGNORE INTO user_stats (user_id, total_xp, current_streak, longest_streak, hearts, gems, last_active_date) VALUES (?, 0, 0, 0, 5, 50, ?)"
    ).bind(userId, today),
    env.DB.prepare(
      "INSERT OR IGNORE INTO user_inventory (user_id, item_code, quantity) VALUES (?, 'streak_freeze', 1)"
    ).bind(userId),
    env.DB.prepare(
      "INSERT OR IGNORE INTO weekly_leaderboards (user_id, league_name, weekly_xp, week_start_date) VALUES (?, 'Bronze', 0, ?)"
    ).bind(userId, weekStart)
  ];

  await env.DB.batch(ops);

  const profile = await env.DB.prepare(
    "SELECT id, user_id, full_name, avatar_url, bio, cover_url, school, major, created_at FROM profiles WHERE user_id = ? LIMIT 1"
  ).bind(userId).first();
  const stats = await env.DB.prepare(
    "SELECT * FROM user_stats WHERE user_id = ? LIMIT 1"
  ).bind(userId).first();

  const cleanProfile = {
    ...(profile || {}),
    id: profile?.id || profileId,
    user_id: userId,
    username: username,
    full_name: fullName,
    avatar_url: null,
    bio: "",
    cover_url: null,
    school: "",
    major: "",
    created_at: today
  };

  return respond(
    { ok: true, user: cleanProfile, stats: stats || {}, message: "Tạo tài khoản thành công! Tặng bạn 50 Đá quý 💎 chào mừng!" },
    200,
    { "set-cookie": cookieHeader(request, userId, COOKIE_AGE) }
  );
}

async function loginAccount(request, env) {
  const body = await readJson(request);
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!username || !password) {
    throw new HttpError(400, "Vui lòng nhập tên đăng nhập và mật khẩu.");
  }
  const account = await env.DB.prepare(
    "SELECT id, user_id, username, encrypted_password FROM accounts WHERE username = ? LIMIT 1"
  ).bind(username).first();

  if (!account) {
    throw new HttpError(401, "Tên đăng nhập hoặc mật khẩu không chính xác.");
  }
  const hash = await hashPassword(password);
  if (account.encrypted_password !== hash) {
    throw new HttpError(401, "Tên đăng nhập hoặc mật khẩu không chính xác.");
  }

  const profile = await env.DB.prepare(
    "SELECT id, user_id, full_name, avatar_url, bio, cover_url, school, major, created_at FROM profiles WHERE user_id = ? LIMIT 1"
  ).bind(account.user_id).first();
  const stats = await env.DB.prepare(
    "SELECT * FROM user_stats WHERE user_id = ? LIMIT 1"
  ).bind(account.user_id).first();

  if (profile) {
    profile.username = account.username;
    profile.bio = profile.bio || "";
    profile.school = profile.school || "";
    profile.major = profile.major || "";
  }

  return respond(
    { ok: true, user: profile, stats: stats || {}, message: "Đăng nhập thành công! Chào mừng trở lại." },
    200,
    { "set-cookie": cookieHeader(request, account.user_id, COOKIE_AGE) }
  );
}

async function checkAndUnlockAchievements(userId, env) {
  try {
    const [stats, completedCount, unlocked] = await Promise.all([
      env.DB.prepare("SELECT total_xp, current_streak, longest_streak FROM user_stats WHERE user_id = ?").bind(userId).first(),
      env.DB.prepare("SELECT COUNT(DISTINCT lesson_id) as count FROM user_progress WHERE user_id = ? AND status = 'completed'").bind(userId).first(),
      env.DB.prepare("SELECT achievement_id FROM user_achievements WHERE user_id = ?").bind(userId).all()
    ]);
    const unlockedIds = new Set((unlocked.results || []).map(function (r) { return Number(r.achievement_id); }));
    const lessonsDone = Number(completedCount && completedCount.count) || 0;
    const streak = Math.max(Number(stats && stats.current_streak) || 0, Number(stats && stats.longest_streak) || 0);
    const xp = Number(stats && stats.total_xp) || 0;

    const toUnlock = [];
    if (lessonsDone >= 1 && !unlockedIds.has(1)) toUnlock.push(1);
    if (streak >= 3 && !unlockedIds.has(2)) toUnlock.push(2);
    if (streak >= 7 && !unlockedIds.has(3)) toUnlock.push(3);
    if (streak >= 30 && !unlockedIds.has(4)) toUnlock.push(4);
    if (xp >= 100 && !unlockedIds.has(5)) toUnlock.push(5);
    if (xp >= 500 && !unlockedIds.has(6)) toUnlock.push(6);
    if (xp >= 1000 && !unlockedIds.has(7)) toUnlock.push(7);
    if (lessonsDone >= 10 && !unlockedIds.has(8)) toUnlock.push(8);
    if (lessonsDone >= 50 && !unlockedIds.has(9)) toUnlock.push(9);
    if (lessonsDone >= 100 && !unlockedIds.has(10)) toUnlock.push(10);

    if (toUnlock.length > 0) {
      const ops = toUnlock.map(function (achId) {
        return env.DB.prepare("INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)").bind(userId, achId);
      });
      ops.push(env.DB.prepare("UPDATE user_stats SET gems = gems + ? WHERE user_id = ?").bind(toUnlock.length * 10, userId));
      await env.DB.batch(ops);
    }
  } catch (err) {
    console.error("checkAndUnlockAchievements error:", err);
  }
}

async function shopList(user, env) {
  const [itemsRes, inventoryRes, stats] = await Promise.all([
    env.DB.prepare("SELECT id, item_code, name, description, price_gems FROM shop_items ORDER BY id").all(),
    env.DB.prepare("SELECT item_code, quantity FROM user_inventory WHERE user_id = ?").bind(user.userId).all(),
    env.DB.prepare("SELECT gems, hearts FROM user_stats WHERE user_id = ? LIMIT 1").bind(user.userId).first()
  ]);
  const inventoryMap = new Map((inventoryRes.results || []).map(function (r) { return [r.item_code, Number(r.quantity) || 0]; }));
  const items = (itemsRes.results || []).map(function (item) {
    return Object.assign({}, item, {
      owned: inventoryMap.get(item.item_code) || 0
    });
  });
  return {
    items: items,
    gems: Number(stats && stats.gems) || 0,
    hearts: Number(stats && stats.hearts == null ? 5 : stats.hearts)
  };
}

async function buyShopItem(request, user, env) {
  const body = await readJson(request);
  const itemCode = String(body.itemCode || "").trim();
  const item = await env.DB.prepare(
    "SELECT id, item_code, name, price_gems FROM shop_items WHERE item_code = ? LIMIT 1"
  ).bind(itemCode).first();
  if (!item) throw new HttpError(404, "Vật phẩm không tồn tại trong Cửa hàng.");

  const stats = await env.DB.prepare(
    "SELECT gems, hearts FROM user_stats WHERE user_id = ? LIMIT 1"
  ).bind(user.userId).first();
  const currentGems = Number(stats && stats.gems) || 0;
  if (currentGems < item.price_gems) {
    throw new HttpError(400, "Bạn không đủ Đá quý. Cần " + item.price_gems + " 💎 nhưng bạn chỉ có " + currentGems + " 💎.");
  }

  const ops = [
    env.DB.prepare("UPDATE user_stats SET gems = gems - ? WHERE user_id = ?").bind(item.price_gems, user.userId)
  ];
  if (itemCode === "refill_hearts") {
    ops.push(env.DB.prepare("UPDATE user_stats SET hearts = 5 WHERE user_id = ?").bind(user.userId));
  }
  const existingInv = await env.DB.prepare(
    "SELECT id, quantity FROM user_inventory WHERE user_id = ? AND item_code = ? LIMIT 1"
  ).bind(user.userId, itemCode).first();
  if (itemCode.startsWith("mascot_") && existingInv && Number(existingInv.quantity) >= 1) {
    throw new HttpError(400, "Bạn đã sở hữu gói Mascot này rồi, không thể mua lại!");
  }
  if (existingInv) {
    ops.push(env.DB.prepare("UPDATE user_inventory SET quantity = quantity + 1 WHERE id = ?").bind(existingInv.id));
  } else {
    ops.push(env.DB.prepare("INSERT INTO user_inventory (user_id, item_code, quantity) VALUES (?, ?, 1)").bind(user.userId, itemCode));
  }
  await env.DB.batch(ops);

  const updatedStats = await env.DB.prepare("SELECT * FROM user_stats WHERE user_id = ? LIMIT 1").bind(user.userId).first();
  const shopData = await shopList(user, env);
  return { ok: true, message: "Đã mua thành công " + item.name + "!", stats: updatedStats, shop: shopData };
}

async function achievementsList(user, env) {
  const [achRes, userAchRes, stats, completedRes] = await Promise.all([
    env.DB.prepare("SELECT id, title, description, badge_icon_url, required_value FROM achievements ORDER BY id").all(),
    env.DB.prepare("SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?").bind(user.userId).all(),
    env.DB.prepare("SELECT total_xp, current_streak, longest_streak FROM user_stats WHERE user_id = ? LIMIT 1").bind(user.userId).first(),
    env.DB.prepare("SELECT COUNT(DISTINCT lesson_id) as count FROM user_progress WHERE user_id = ? AND status = 'completed'").bind(user.userId).first()
  ]);
  const unlockedMap = new Map((userAchRes.results || []).map(function (r) { return [r.achievement_id, r.unlocked_at]; }));
  const lessonsCount = Number(completedRes && completedRes.count) || 0;
  const streak = Math.max(Number(stats && stats.current_streak) || 0, Number(stats && stats.longest_streak) || 0);
  const xp = Number(stats && stats.total_xp) || 0;

  const items = (achRes.results || []).map(function (ach) {
    let currentVal = 0;
    if (ach.id === 1 || ach.id === 8 || ach.id === 9 || ach.id === 10) currentVal = lessonsCount;
    else if (ach.id === 2 || ach.id === 3 || ach.id === 4) currentVal = streak;
    else if (ach.id === 5 || ach.id === 6 || ach.id === 7) currentVal = xp;
    const isUnlocked = unlockedMap.has(ach.id) || currentVal >= ach.required_value;
    return Object.assign({}, ach, {
      current_value: currentVal,
      unlocked: isUnlocked,
      unlocked_at: unlockedMap.get(ach.id) || (isUnlocked ? new Date().toISOString() : null)
    });
  });
  return { achievements: items };
}

async function solveMistake(request, user, env) {
  const body = await readJson(request);
  const mistakeId = Number(body.mistakeId);

  let mistake = await env.DB.prepare(
    "SELECT m.id, m.question_id, m.is_mastered, q.correct_answer, q.explanation " +
    "FROM user_mistakes m JOIN questions q ON q.id = m.question_id " +
    "WHERE (m.id = ? OR m.question_id = ?) AND m.user_id = ? LIMIT 1"
  ).bind(mistakeId, mistakeId, user.userId).first();

  if (!mistake) {
    const q = await env.DB.prepare("SELECT id, correct_answer, explanation FROM questions WHERE id = ? LIMIT 1").bind(mistakeId).first();
    if (q) {
      mistake = { id: 0, question_id: q.id, is_mastered: 0, correct_answer: q.correct_answer, explanation: q.explanation };
    } else {
      throw new HttpError(404, "Không tìm thấy câu hỏi ôn tập này.");
    }
  }

  let isCorrect = Boolean(body.isCorrect);
  if (body.selectedChoice !== undefined && body.selectedChoice !== null) {
    isCorrect = normalizeAnswer(body.selectedChoice) === normalizeAnswer(mistake.correct_answer);
  }

  const ops = [];
  if (isCorrect) {
    if (mistake.id > 0) {
      ops.push(env.DB.prepare("UPDATE user_mistakes SET is_mastered = 1 WHERE id = ?").bind(mistake.id));
    }
    ops.push(env.DB.prepare("UPDATE user_stats SET hearts = MIN(5, hearts + 1), total_xp = total_xp + 5 WHERE user_id = ?").bind(user.userId));
  } else {
    if (mistake.id > 0) {
      ops.push(env.DB.prepare("UPDATE user_mistakes SET wrong_count = wrong_count + 1, last_wrong_at = CURRENT_TIMESTAMP WHERE id = ?").bind(mistake.id));
    }
  }
  if (ops.length > 0) {
    await env.DB.batch(ops);
  }

  const updatedStats = await env.DB.prepare("SELECT * FROM user_stats WHERE user_id = ? LIMIT 1").bind(user.userId).first();
  return {
    ok: true,
    isCorrect: isCorrect,
    correctAnswer: normalizeAnswer(mistake.correct_answer),
    explanation: mistake.explanation || "",
    stats: updatedStats,
    restoredHeart: isCorrect
  };
}

async function getDailyQuests(user, env) {
  const today = vietDate();
  const [progressSummary, todayMistakes] = await Promise.all([
    env.DB.prepare(
      "SELECT COUNT(DISTINCT lesson_id) as lessons_count, " +
      "COUNT(DISTINCT CASE WHEN score >= 80 THEN lesson_id END) as high_scores_count " +
      "FROM user_progress WHERE user_id = ? AND status = 'completed' AND date(completed_at, '+7 hours') = ?"
    ).bind(user.userId, today).first(),
    env.DB.prepare(
      "SELECT COUNT(*) as count FROM user_mistakes WHERE user_id = ? AND is_mastered = 1 AND date(last_wrong_at, '+7 hours') = ?"
    ).bind(user.userId, today).first()
  ]);

  const claimedRows = await env.DB.prepare(
    "SELECT quest_code, claimed_at FROM user_daily_quests WHERE user_id = ? AND quest_date = ?"
  ).bind(user.userId, today).all();
  const claimedSet = new Set((claimedRows.results || []).map(r => r.quest_code));

  const lessonsCount = Number(progressSummary?.lessons_count || 0);
  const highScoresCount = Number(progressSummary?.high_scores_count || 0);
  const mistakesCount = Number(todayMistakes?.count || 0);
  // Mỗi bài học hoàn thành đạt 10 XP, mỗi câu sai ôn tập khắc phục đạt 5 XP
  const xpCount = (lessonsCount * 10) + (mistakesCount * 5);

  const questDefs = [
    {
      code: "first_lesson",
      title: "Khởi động ngày mới 🌅",
      description: "Hoàn thành bài học đầu tiên trong ngày",
      target: 1,
      current: Math.min(1, lessonsCount),
      gems: 10,
      icon: "🌅"
    },
    {
      code: "study_3_lessons",
      title: "Chăm chỉ rèn luyện 📚",
      description: "Hoàn thành 3 bài học trong ngày hôm nay",
      target: 3,
      current: Math.min(3, lessonsCount),
      gems: 15,
      icon: "📚"
    },
    {
      code: "study_5_lessons",
      title: "Chiến thần tri thức ⚡",
      description: "Chinh phục 5 bài học trong ngày",
      target: 5,
      current: Math.min(5, lessonsCount),
      gems: 25,
      icon: "⚡"
    },
    {
      code: "high_score_80",
      title: "Học bá xuất sắc 🎯",
      description: "Đạt điểm số từ 80% trở lên ở 2 bài học",
      target: 2,
      current: Math.min(2, highScoresCount),
      gems: 15,
      icon: "🎯"
    },
    {
      code: "earn_50_xp",
      title: "Tích lũy kinh nghiệm ⭐",
      description: "Gặt hái ít nhất 50 điểm kinh nghiệm XP hôm nay",
      target: 50,
      current: Math.min(50, xpCount),
      gems: 20,
      icon: "⭐"
    },
    {
      code: "review_3_mistakes",
      title: "Ôn nhuần nhuyễn 🔍",
      description: "Khắc phục thành công 3 câu hỏi ôn tập",
      target: 3,
      current: Math.min(3, mistakesCount),
      gems: 15,
      icon: "🔍"
    }
  ];

  const quests = questDefs.map(q => ({
    ...q,
    progressPercent: Math.min(100, Math.round((q.current / q.target) * 100)),
    isCompleted: q.current >= q.target,
    isClaimed: claimedSet.has(q.code)
  }));

  return {
    date: today,
    quests,
    totalGemsAvailable: quests.reduce((sum, q) => sum + q.gems, 0),
    totalGemsClaimed: quests.filter(q => q.isClaimed).reduce((sum, q) => sum + q.gems, 0)
  };
}

async function claimDailyQuest(request, user, env) {
  const body = await readJson(request);
  const questCode = String(body.questCode || "").trim();
  const daily = await getDailyQuests(user, env);
  const targetQuest = daily.quests.find(q => q.code === questCode);
  if (!targetQuest) throw new HttpError(404, "Không tìm thấy nhiệm vụ này.");
  if (!targetQuest.isCompleted) throw new HttpError(400, "Bạn chưa hoàn thành mục tiêu của nhiệm vụ này.");
  if (targetQuest.isClaimed) throw new HttpError(400, "Bạn đã nhận thưởng nhiệm vụ này hôm nay rồi.");

  const today = vietDate();
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO user_daily_quests (user_id, quest_date, quest_code) VALUES (?, ?, ?)"
    ).bind(user.userId, today, questCode),
    env.DB.prepare(
      "UPDATE user_stats SET gems = gems + ? WHERE user_id = ?"
    ).bind(targetQuest.gems, user.userId)
  ]);

  const updatedStats = await env.DB.prepare("SELECT * FROM user_stats WHERE user_id = ? LIMIT 1").bind(user.userId).first();
  return {
    ok: true,
    claimedCode: questCode,
    gemsAwarded: targetQuest.gems,
    stats: updatedStats
  };
}

async function claimLeaderboardReward(request, user, env) {
  const body = await readJson(request);
  const weekStart = String(body.weekStart || "").trim();
  if (!weekStart) throw new HttpError(400, "Thiếu thông tin tuần giải đấu.");

  const existing = await env.DB.prepare(
    "SELECT id FROM user_leaderboard_rewards WHERE user_id = ? AND week_start_date = ? LIMIT 1"
  ).bind(user.userId, weekStart).first();
  if (existing) throw new HttpError(400, "Bạn đã nhận phần thưởng giải đấu của tuần này rồi.");

  const board = await env.DB.prepare(
    "SELECT user_id, weekly_xp FROM weekly_leaderboards WHERE week_start_date = ? ORDER BY weekly_xp DESC, user_id LIMIT 3"
  ).bind(weekStart).all();
  const list = board.results || [];
  let userRank = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i].user_id === user.userId) {
      userRank = i + 1;
      break;
    }
  }
  if (userRank < 1 || userRank > 3) {
    throw new HttpError(400, "Bạn không nằm trong Top 1, 2, 3 của tuần này để nhận thưởng.");
  }

  const gemsByRank = { 1: 100, 2: 60, 3: 40 };
  const gemsAwarded = gemsByRank[userRank] || 40;

  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO user_leaderboard_rewards (user_id, week_start_date, rank, gems_awarded) VALUES (?, ?, ?, ?)"
    ).bind(user.userId, weekStart, userRank, gemsAwarded),
    env.DB.prepare(
      "UPDATE user_stats SET gems = gems + ? WHERE user_id = ?"
    ).bind(gemsAwarded, user.userId)
  ]);

  const updatedStats = await env.DB.prepare("SELECT * FROM user_stats WHERE user_id = ? LIMIT 1").bind(user.userId).first();
  return {
    ok: true,
    rank: userRank,
    gemsAwarded: gemsAwarded,
    stats: updatedStats
  };
}

async function leaderboard(user, env) {
  const today = vietDate();
  const weekStart = mondayDate(today);
  const response = await env.DB.prepare(
    "SELECT w.user_id, COALESCE(p.full_name, a.username, 'Học viên 3TG') AS full_name, p.avatar_url, w.league_name, w.weekly_xp " +
    "FROM weekly_leaderboards w " +
    "LEFT JOIN profiles p ON p.user_id = w.user_id " +
    "LEFT JOIN accounts a ON a.user_id = w.user_id " +
    "WHERE w.week_start_date = ? ORDER BY w.weekly_xp DESC, w.user_id LIMIT 30"
  ).bind(weekStart).all();
  
  const rows = (response.results || []).map(function (row, index) {
    return Object.assign({}, row, { rank: index + 1, isMe: row.user_id === user.userId });
  });

  const lastWeekStart = mondayDate(shiftDate(today, -7));
  let pendingReward = null;

  try {
    const lastWeekTop = await env.DB.prepare(
      "SELECT user_id, weekly_xp FROM weekly_leaderboards WHERE week_start_date = ? ORDER BY weekly_xp DESC, user_id LIMIT 3"
    ).bind(lastWeekStart).all();

    const top3 = lastWeekTop.results || [];
    for (let i = 0; i < top3.length; i++) {
      if (top3[i].user_id === user.userId) {
        const rank = i + 1;
        const gemsReward = rank === 1 ? 100 : rank === 2 ? 60 : 40;
        const claimed = await env.DB.prepare(
          "SELECT id FROM user_leaderboard_rewards WHERE user_id = ? AND week_start_date = ? LIMIT 1"
        ).bind(user.userId, lastWeekStart).first();

        if (!claimed) {
          pendingReward = {
            weekStart: lastWeekStart,
            rank: rank,
            gems: gemsReward
          };
        }
        break;
      }
    }
  } catch {}

  return {
    weekStart: weekStart,
    league: "Bronze",
    rows: rows,
    prizes: [
      { rank: 1, gems: 100, title: "Quán Quân Tuần 👑", badge: "🥇" },
      { rank: 2, gems: 60, title: "Á Quân Tuần 🥈", badge: "🥈" },
      { rank: 3, gems: 40, title: "Hạng Ba Tuần 🥉", badge: "🥉" }
    ],
    pendingReward: pendingReward
  };
}

async function getUserPublicProfile(targetUserId, currentUser, env) {
  const profile = await env.DB.prepare(
    "SELECT p.id, p.user_id, p.full_name, p.avatar_url, p.bio, p.cover_url, p.school, p.major, p.created_at, a.username " +
    "FROM profiles p LEFT JOIN accounts a ON a.user_id = p.user_id WHERE p.user_id = ? LIMIT 1"
  ).bind(targetUserId).first();
  if (!profile) throw new HttpError(404, "Không tìm thấy hồ sơ học viên này.");

  const stats = await env.DB.prepare(
    "SELECT total_xp, current_streak, longest_streak, hearts, gems, last_active_date FROM user_stats WHERE user_id = ? LIMIT 1"
  ).bind(targetUserId).first() || { total_xp: 0, current_streak: 0, longest_streak: 0, hearts: 5, gems: 0 };

  const weekStart = mondayDate(vietDate());
  const lb = await env.DB.prepare(
    "SELECT league_name, weekly_xp FROM weekly_leaderboards WHERE user_id = ? AND week_start_date = ? LIMIT 1"
  ).bind(targetUserId, weekStart).first();

  const progress = await env.DB.prepare(
    "SELECT COUNT(DISTINCT lesson_id) AS completed_count FROM user_progress WHERE user_id = ? AND status = 'completed'"
  ).bind(targetUserId).first();

  const ach = await env.DB.prepare(
    "SELECT COUNT(*) AS ach_count FROM user_achievements WHERE user_id = ?"
  ).bind(targetUserId).first();

  const friend = await env.DB.prepare(
    "SELECT id, status FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?) LIMIT 1"
  ).bind(currentUser.userId, targetUserId, targetUserId, currentUser.userId).first();

  return {
    profile: profile,
    stats: stats,
    league: lb?.league_name || "Bronze",
    weeklyXp: lb?.weekly_xp || 0,
    completedLessons: progress?.completed_count || 0,
    achievementsCount: ach?.ach_count || 0,
    isSelf: currentUser.userId === targetUserId,
    isFriend: !!friend,
    friendStatus: friend?.status || null
  };
}

async function toggleFriend(request, currentUser, env) {
  const body = await readJson(request);
  const targetUserId = String(body.targetUserId || "").trim();
  if (!targetUserId) throw new HttpError(400, "Thiếu mã học viên.");
  if (targetUserId === currentUser.userId) throw new HttpError(400, "Bạn không thể kết bạn với chính mình.");

  const target = await env.DB.prepare("SELECT user_id FROM profiles WHERE user_id = ? LIMIT 1").bind(targetUserId).first();
  if (!target) throw new HttpError(404, "Học viên không tồn tại.");

  const existing = await env.DB.prepare(
    "SELECT id FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?) LIMIT 1"
  ).bind(currentUser.userId, targetUserId, targetUserId, currentUser.userId).first();

  const now = vietDate();
  if (existing) {
    await env.DB.prepare(
      "DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)"
    ).bind(currentUser.userId, targetUserId, targetUserId, currentUser.userId).run();
    return { isFriend: false, message: "Đã hủy kết bạn thành công." };
  } else {
    await env.DB.prepare(
      "INSERT INTO friendships (user_id, friend_id, status, created_at) VALUES (?, ?, 'accepted', ?)"
    ).bind(currentUser.userId, targetUserId, now).run();
    return { isFriend: true, message: "Đã kết bạn thành công! 🎉" };
  }
}

async function getFriendsList(currentUser, env) {
  const query = 
    "SELECT " +
      "CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END AS friend_user_id, " +
      "f.created_at AS friendship_date, " +
      "COALESCE(p.full_name, a.username, 'Học viên 3TG') AS full_name, " +
      "p.avatar_url, p.school, p.major, a.username, " +
      "COALESCE(s.total_xp, 0) AS total_xp, COALESCE(s.current_streak, 0) AS current_streak, " +
      "COALESCE(w.league_name, 'Bronze') AS league_name " +
    "FROM friendships f " +
    "JOIN profiles p ON p.user_id = (CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END) " +
    "LEFT JOIN accounts a ON a.user_id = p.user_id " +
    "LEFT JOIN user_stats s ON s.user_id = p.user_id " +
    "LEFT JOIN weekly_leaderboards w ON w.user_id = p.user_id " +
    "WHERE f.user_id = ? OR f.friend_id = ? " +
    "GROUP BY friend_user_id " +
    "ORDER BY s.total_xp DESC";

  const res = await env.DB.prepare(query).bind(currentUser.userId, currentUser.userId, currentUser.userId, currentUser.userId).all();
  return { friends: res.results || [] };
}

async function searchUsers(request, currentUser, env) {
  const url = new URL(request.url);
  const q = String(url.searchParams.get("q") || "").trim();
  if (!q) return { users: [] };
  const pattern = "%" + q + "%";

  const res = await env.DB.prepare(
    "SELECT p.user_id, COALESCE(p.full_name, a.username, 'Học viên 3TG') AS full_name, " +
    "p.avatar_url, p.school, p.major, a.username, " +
    "COALESCE(s.total_xp, 0) AS total_xp, COALESCE(s.current_streak, 0) AS current_streak, " +
    "EXISTS (SELECT 1 FROM friendships f WHERE (f.user_id = ? AND f.friend_id = p.user_id) OR (f.user_id = p.user_id AND f.friend_id = ?)) AS is_friend " +
    "FROM profiles p " +
    "LEFT JOIN accounts a ON a.user_id = p.user_id " +
    "LEFT JOIN user_stats s ON s.user_id = p.user_id " +
    "WHERE p.user_id != ? AND (p.full_name LIKE ? OR a.username LIKE ? OR p.school LIKE ?) " +
    "ORDER BY s.total_xp DESC LIMIT 20"
  ).bind(currentUser.userId, currentUser.userId, currentUser.userId, pattern, pattern, pattern).all();

  return { users: res.results || [] };
}

async function getConversations(currentUser, env) {
  const query = 
    "SELECT " +
      "CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_user_id, " +
      "message AS last_message, " +
      "created_at, " +
      "sender_id " +
    "FROM direct_messages " +
    "WHERE sender_id = ? OR receiver_id = ? " +
    "ORDER BY id DESC";

  const raw = await env.DB.prepare(query).bind(currentUser.userId, currentUser.userId, currentUser.userId).all();
  const seen = new Set();
  const convos = [];

  for (const row of (raw.results || [])) {
    if (!seen.has(row.other_user_id)) {
      seen.add(row.other_user_id);
      const other = await env.DB.prepare(
        "SELECT p.user_id, COALESCE(p.full_name, a.username, 'Học viên 3TG') AS full_name, p.avatar_url, a.username " +
        "FROM profiles p LEFT JOIN accounts a ON a.user_id = p.user_id WHERE p.user_id = ? LIMIT 1"
      ).bind(row.other_user_id).first();

      const unread = await env.DB.prepare(
        "SELECT COUNT(*) AS c FROM direct_messages WHERE sender_id = ? AND receiver_id = ? AND is_read = 0"
      ).bind(row.other_user_id, currentUser.userId).first();

      if (other) {
        convos.push({
          user: other,
          lastMessage: row.last_message,
          lastTime: row.created_at,
          isMine: row.sender_id === currentUser.userId,
          unreadCount: unread?.c || 0
        });
      }
    }
  }

  return { conversations: convos };
}

async function getMessagesWithUser(targetUserId, currentUser, env) {
  await env.DB.prepare(
    "UPDATE direct_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0"
  ).bind(targetUserId, currentUser.userId).run();

  const messages = await env.DB.prepare(
    "SELECT id, sender_id, receiver_id, message, is_read, created_at " +
    "FROM direct_messages " +
    "WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) " +
    "ORDER BY id ASC LIMIT 100"
  ).bind(currentUser.userId, targetUserId, targetUserId, currentUser.userId).all();

  const targetUser = await env.DB.prepare(
    "SELECT p.user_id, COALESCE(p.full_name, a.username, 'Học viên 3TG') AS full_name, p.avatar_url, a.username " +
    "FROM profiles p LEFT JOIN accounts a ON a.user_id = p.user_id WHERE p.user_id = ? LIMIT 1"
  ).bind(targetUserId).first();

  return {
    messages: (messages.results || []).map(m => ({
      id: m.id,
      message: m.message,
      isMine: m.sender_id === currentUser.userId,
      createdAt: m.created_at
    })),
    targetUser: targetUser || { user_id: targetUserId, full_name: "Học viên 3TG" }
  };
}

async function sendMessageToUser(request, targetUserId, currentUser, env) {
  const body = await readJson(request);
  const text = String(body.message || "").trim().slice(0, 1000);
  if (!text) throw new HttpError(400, "Nội dung tin nhắn không được để trống.");

  const target = await env.DB.prepare("SELECT user_id FROM profiles WHERE user_id = ? LIMIT 1").bind(targetUserId).first();
  if (!target) throw new HttpError(404, "Học viên không tồn tại.");

  const now = new Date().toISOString();
  const res = await env.DB.prepare(
    "INSERT INTO direct_messages (sender_id, receiver_id, message, is_read, created_at) VALUES (?, ?, ?, 0, ?)"
  ).bind(currentUser.userId, targetUserId, text, now).run();

  return {
    ok: true,
    message: {
      id: res.meta?.last_row_id || Date.now(),
      message: text,
      isMine: true,
      createdAt: now
    }
  };
}

async function askAI(request, user, env) {
  const contentLength = Number(request.headers.get("content-length")) || 0;
  if (contentLength > 24 * 1024 * 1024) throw new HttpError(413, "Tổng dung lượng tin nhắn và tệp không được vượt 24 MB.");
  const body = await readJson(request);
  let message = String(body.message || "").trim().slice(0, 1800);
  const attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, 5) : [];
  if (!message && !attachments.length) throw new HttpError(400, "Viết câu hỏi hoặc chọn tệp trước khi gửi nhé.");
  if (!message) message = "Hãy đọc các tệp đính kèm, tóm tắt ý chính và giúp mình học nội dung quan trọng.";
  let attachmentTextSize = 0;
  let attachmentImageSize = 0;
  const imageParts = [];
  const documentParts = [];
  const attachmentNames = [];
  for (const item of attachments) {
    const name = String(item && item.name || "Tệp đính kèm").slice(0, 160);
    attachmentNames.push(name);
    if (item && typeof item.text === "string") {
      const text = item.text.slice(0, 52000);
      attachmentTextSize += text.length;
      if (attachmentTextSize > 52000) throw new HttpError(413, "Văn bản trích từ tài liệu vượt giới hạn 52.000 ký tự.");
      documentParts.push({ name: name, text: text });
      continue;
    }
    const type = String(item && item.type || "").toLowerCase();
    const data = String(item && item.data || "");
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(type) || !/^[a-z0-9+/]*={0,2}$/i.test(data)) {
      throw new HttpError(400, "Ảnh đính kèm chưa đúng định dạng hỗ trợ.");
    }
    attachmentImageSize += Math.floor(data.length * 3 / 4);
    if (attachmentImageSize > 16 * 1024 * 1024) throw new HttpError(413, "Tổng dung lượng ảnh đính kèm không được vượt 16 MB.");
    imageParts.push({ type: "image_url", image_url: { url: "data:" + type + ";base64," + data } });
  }
  let conversationId = String(body.conversationId || "").trim().slice(0, 80);
  if (conversationId) {
    const ownedConversation = await env.DB.prepare(
      "SELECT id FROM ai_conversations WHERE id = ? AND user_id = ? LIMIT 1"
    ).bind(conversationId, user.userId).first();
    if (!ownedConversation) throw new HttpError(404, "Không tìm thấy phiên hỏi đáp này.");
  } else {
    conversationId = crypto.randomUUID();
  }
  let endpoint = String(env.LOCAL_AI_ENDPOINT || "").trim();
  const apiKey = env.LOCAL_AI_API_KEY || env.DEEPSEEK_API_KEY || env.VITE_DEEPSEEK_API_KEY || "";
  const configuredModel = env.LOCAL_AI_MODEL || env.DEEPSEEK_MODEL || env.VITE_DEEPSEEK_MODEL || "";

  if (!endpoint && apiKey) {
    endpoint = "https://api.deepseek.com/chat/completions";
  }

  if (!endpoint) throw new HttpError(503, "Chưa cấu hình AI. Hãy thiết lập LOCAL_AI_ENDPOINT hoặc DEEPSEEK_API_KEY trong file .env / .dev.vars.");
  let parsedEndpoint;
  try { parsedEndpoint = new URL(endpoint); } catch { throw new HttpError(503, "Endpoint AI chưa phải URL hợp lệ."); }
  if (!["http:", "https:"].includes(parsedEndpoint.protocol)) throw new HttpError(503, "Endpoint AI chỉ hỗ trợ HTTP hoặc HTTPS.");

  const defaultModel = apiKey.startsWith("sk-") ? "deepseek-chat" : "qwen2.5:14b-instruct";
  const model = imageParts.length
    ? (env.LOCAL_AI_VISION_MODEL || configuredModel || defaultModel)
    : (configuredModel || defaultModel);
  const freeMode = body.freeMode === true;
  let courseTitle = "";
  let context = "";
  if (!freeMode && body.subjectId) {
    const subject = await env.DB.prepare("SELECT subject_name FROM subjects WHERE id = ?").bind(body.subjectId).first();
    if (subject) {
      courseTitle = subject.subject_name;
      context = await courseSnippets(env, courseTitle, message);
    }
  }
  const systemText = "Bạn là Lumi AI, trợ giảng học tập thân thiện và thông minh bằng tiếng Việt của Lumi Study. " +
    "Giải thích rõ ràng, gần gũi, theo từng bước khi phù hợp. Không bịa thông tin về tài liệu môn học. " +
    "Nếu câu hỏi cần dữ liệu mà phần ngữ cảnh không có, hãy nói rõ điều đó rồi giải thích phần kiến thức chung với nhãn phân biệt. " +
    "Khuyến khích người học tự suy nghĩ và không tiết lộ đáp án trắc nghiệm nếu họ chưa hỏi.";
  const contextText = freeMode
    ? "Chế độ AI tự do: có thể hỗ trợ nhiều môn và kiến thức đời sống. Phân biệt rõ kiến thức chung với thông tin có trong tệp người học gửi."
    : "Môn đang học: " + (courseTitle || "chưa chọn") + ".\n" +
      (context ? "Trích đoạn liên quan từ dữ liệu môn học:\n" + context :
        "Không tìm thấy hoặc chưa chọn trích đoạn tài liệu phù hợp; đừng nói rằng bạn đã đọc tài liệu của môn.");
  const history = Array.isArray(body.history) ? body.history.slice(-8).map(function (item) {
    const role = item && (item.role === "assistant" || item.role === "user") ? item.role : "";
    return role && item.content ? { role: role, content: String(item.content).slice(0, 1500) } : null;
  }).filter(Boolean) : [];
  const documentsText = documentParts.map(file => "\n\n--- Tệp: " + file.name + " ---\n" + file.text).join("");
  const userPrompt = message + documentsText;
  const userContent = imageParts.length
    ? [{ type: "text", text: userPrompt + (imageParts.length ? "\n\nHãy phân tích nội dung trong ảnh đính kèm." : "") }, ...imageParts]
    : userPrompt;
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: Object.assign({ "content-type": "application/json" }, apiKey ? { authorization: "Bearer " + apiKey } : {}),
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemText + "\n\n" + contextText },
          ...history,
          { role: "user", content: userContent }
        ],
        temperature: 0.55,
        max_tokens: 1500
      }),
      signal: AbortSignal.timeout(90000)
    });
  } catch (err) {
    console.error("AI fetch error:", err);
    throw new HttpError(502, "Lumi chưa kết nối được với trợ giảng AI. Thử gửi lại sau một chút nhé.");
  }
  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error("AI response error:", response.status, errText);
    throw new HttpError(502, imageParts.length
      ? "AI chưa đọc được ảnh. Hãy kiểm tra model có hỗ trợ vision hoặc gửi ảnh nhỏ hơn."
      : "Trợ giảng Lumi AI đang bận hoặc gặp sự cố (" + response.status + "). Bạn thử lại sau một chút nhé.");
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new HttpError(502, "Trợ giảng AI trả về phản hồi chưa đọc được.");
  }
  const reply = result && result.choices && result.choices[0] && result.choices[0].message
    ? String(result.choices[0].message.content || "")
    : "";
  if (!reply) throw new HttpError(502, "Lumi chưa nhận được câu trả lời. Thử hỏi lại nhé.");
  const now = new Date().toISOString();
  const isNewConversation = !body.conversationId;
  const storedMessage = message + (attachmentNames.length ? "\n\n[Tệp đính kèm: " + attachmentNames.join(", ") + "]" : "");
  const operations = [];
  if (isNewConversation) {
    operations.push(env.DB.prepare(
      "INSERT INTO ai_conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(conversationId, user.userId, message.slice(0, 80), now, now));
  } else {
    operations.push(env.DB.prepare("UPDATE ai_conversations SET updated_at = ? WHERE id = ? AND user_id = ?").bind(now, conversationId, user.userId));
  }
  operations.push(
    env.DB.prepare("INSERT INTO ai_messages (conversation_id, sender, content, created_at) VALUES (?, 'user', ?, ?)").bind(conversationId, storedMessage, now),
    env.DB.prepare("INSERT INTO ai_messages (conversation_id, sender, content, created_at) VALUES (?, 'assistant', ?, ?)").bind(conversationId, reply, now)
  );
  await env.DB.batch(operations);
  return { reply: reply, conversationId: conversationId };
}

async function listAiConversations(user, env) {
  const result = await env.DB.prepare(
    "SELECT id, title, created_at, updated_at FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 30"
  ).bind(user.userId).all();
  return { conversations: result.results || [] };
}

async function readAiConversation(conversationId, user, env) {
  const conversation = await env.DB.prepare(
    "SELECT id, title, created_at, updated_at FROM ai_conversations WHERE id = ? AND user_id = ? LIMIT 1"
  ).bind(conversationId, user.userId).first();
  if (!conversation) throw new HttpError(404, "Không tìm thấy phiên hỏi đáp này.");
  const result = await env.DB.prepare(
    "SELECT id, sender, content, created_at FROM ai_messages WHERE conversation_id = ? ORDER BY created_at, id"
  ).bind(conversationId).all();
  return { conversation: conversation, messages: result.results || [] };
}

async function handleAcademicLoginIU(request, user, env) {
  const body = await readJson(request);
  const { username, password } = body;
  
  if (!username || !password) {
    throw new HttpError(400, "Vui lòng nhập tài khoản/mã sinh viên và mật khẩu cổng IU.");
  }

  let loginResult;
  try {
    loginResult = await loginIUPortal({ username, password });
  } catch (err) {
    throw new HttpError(400, err.message);
  }

  const session = loginResult.session;
  const finalCookie = loginResult.cookie;

  let academicData;
  try {
    academicData = await layBangDiemVaHoSoIU(session, finalCookie);
  } catch (err) {
    throw new HttpError(400, err.message);
  }

  const { studentInfo, rawSubjects } = academicData;
  if (!rawSubjects || !rawSubjects.length) {
    throw new HttpError(404, "Cổng IU chưa có dữ liệu bảng điểm học phần cho tài khoản này.");
  }

  const processed = processAcademicTranscript(rawSubjects, studentInfo);
  const now = new Date().toISOString();
  const rawDataJson = JSON.stringify(processed);

  // Lưu vào database Cloudflare D1 / Local Replica
  try {
    await env.DB.prepare(`
      INSERT INTO user_academic_transcripts (
        user_id, student_code, full_name, major, class_name,
        gpa_10, gpa_4, total_credits, raw_data, last_synced_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        student_code = excluded.student_code,
        full_name = excluded.full_name,
        major = excluded.major,
        class_name = excluded.class_name,
        gpa_10 = excluded.gpa_10,
        gpa_4 = excluded.gpa_4,
        total_credits = excluded.total_credits,
        raw_data = excluded.raw_data,
        last_synced_at = excluded.last_synced_at
    `).bind(
      user.userId,
      processed.student.ma_sinh_vien || "",
      processed.student.ho_ten || "",
      processed.student.nganh || "",
      processed.student.lop || "",
      processed.gpa.overall_10 || 0,
      processed.gpa.overall_4 || 0,
      processed.gpa.total_credits || 0,
      rawDataJson,
      now,
      now
    ).run();
  } catch (err) {
    console.warn("[Academic DB Save]", err.message);
  }

  return { ok: true, transcript: processed, lastSyncedAt: now };
}

async function handleAcademicImportData(request, user, env) {
  const body = await readJson(request);
  const rawInput = body.rawData || body;
  let rawSubjects = [];
  let studentInfo = {};

  if (body.cookie || body.token || (rawInput && (rawInput.cookie || rawInput.token))) {
    const c = body.cookie || rawInput.cookie || "";
    const t = body.token || rawInput.token || "";
    const u = body.userId || rawInput.userId || (user ? user.userId : "student");
    const session = {
      userId: u,
      token: t,
      tokenJWT: t,
      chucNangId: body.chucNangId || "20160101",
      chuongTrinhId: body.chuongTrinhId || "",
      appId: "Portal_SinhVien",
      iM: "AzzSystem"
    };
    try {
      const academicData = await layBangDiemVaHoSoIU(session, c);
      rawSubjects = academicData.rawSubjects || [];
      studentInfo = academicData.studentInfo || {};
    } catch (fetchErr) {
      console.warn("[Academic Fetch From Session Error]", fetchErr.message);
    }
  }

  if (!rawSubjects.length) {
    if (rawInput.raw_subjects) {
      rawSubjects = rawInput.raw_subjects;
      studentInfo = rawInput.student || {};
    } else if (rawInput.IU && rawInput.IU.goc_hoc_tap && rawInput.IU.goc_hoc_tap.tra_cuu_diem && rawInput.IU.goc_hoc_tap.tra_cuu_diem.bang_diem) {
      rawSubjects = rawInput.IU.goc_hoc_tap.tra_cuu_diem.bang_diem;
      studentInfo = (rawInput.IU.ho_so_sinh_vien && rawInput.IU.ho_so_sinh_vien.thong_tin_ca_nhan) || {};
    } else if (rawInput.rsDiemKetThucHocPhan || (rawInput.data && rawInput.data.rsDiemKetThucHocPhan)) {
      const src = rawInput.rsDiemKetThucHocPhan ? rawInput : rawInput.data;
      const r = (src.rsThongTinNguoiHoc && src.rsThongTinNguoiHoc[0]) || {};
      const hoDem = r.QLSV_NGUOIHOC_HODEM || "";
      const ten = r.QLSV_NGUOIHOC_TEN || "";
      const hoTen = `${hoDem} ${ten}`.trim() || r.QLSV_NGUOIHOC_HOTEN || (body.student && body.student.ho_ten) || "Sinh viên CMC";
      studentInfo = {
        ma_sinh_vien: r.QLSV_NGUOIHOC_MASO || (body.student && body.student.ma_sinh_vien) || "",
        ho_ten: hoTen,
        ngay_sinh: r.QLSV_NGUOIHOC_NGAYSINH || "",
        email: r.EMAIL || "",
        lop: r.DAOTAO_LOPQUANLY_TEN || "",
        nganh: r.NGANH || "Công nghệ thông tin",
        khoa: r.KHOA || ""
      };
      const rsDiem = src.rsDiemKetThucHocPhan || [];
      const rsThanhPhan = src.rsDiemThanhPhan || [];
      rawSubjects = rsDiem.map(e => {
        const matchedParts = rsThanhPhan.filter(x =>
          String(x.DAOTAO_HOCPHAN_ID) === String(e.DAOTAO_HOCPHAN_ID) &&
          String(x.LANHOC) === String(e.LANHOC)
        );
        const getPartScore = kw => {
          const f = matchedParts.find(x => new RegExp(kw, "i").test(String(x.DIEM_THANHPHANDIEM_TEN || "")));
          return f && Number.isFinite(Number(f.DIEM)) ? Number(f.DIEM) : null;
        };
        return {
          ma_mon: String(e.DAOTAO_HOCPHAN_MA || ""),
          ten_hoc_phan: String(e.DAOTAO_HOCPHAN_TEN || ""),
          so_tin_chi: Number(e.DAOTAO_HOCPHAN_HOCTRINH) || 3,
          diem_he_10: Number.isFinite(Number(e.DIEM)) ? Number(e.DIEM) : 0,
          diem_he_4: Number.isFinite(Number(e.DIEMQUYDOI)) ? Number(e.DIEMQUYDOI) : 0,
          diem_chu: String(e.DIEMQUYDOI_TEN || "B").trim(),
          hoc_ky: String(e.HOCKY || e.HOC_KY || "Học kỳ 1"),
          nam_hoc: String(e.NAMHOC || e.NAM_HOC || ""),
          xep_loai: String(e.DANHGIA_TEN || ""),
          chi_tiet_diem: {
            chuyen_can: getPartScore("chuy.n.c.n|chuyencan|cc$"),
            bai_tap: getPartScore("b.i.t.p|baitap|bt$"),
            giua_ky: getPartScore("gi.a.k|giuaky|gk$"),
            cuoi_ky: getPartScore("cu.i.k|cuoiky|cu.i.thi|ck$|thi.k.t.th.c"),
          },
        };
      });
    } else if (Array.isArray(rawInput)) {
      rawSubjects = rawInput;
    } else {
      throw new HttpError(400, "Định dạng dữ liệu bảng điểm không hợp lệ.");
    }
  }

  if (body.student && typeof body.student === "object") {
    studentInfo = { ...studentInfo, ...body.student };
  }

  const processed = processAcademicTranscript(rawSubjects, studentInfo);
  const now = new Date().toISOString();
  const rawDataJson = JSON.stringify(processed);

  try {
    await env.DB.prepare(`
      INSERT INTO user_academic_transcripts (
        user_id, student_code, full_name, major, class_name,
        gpa_10, gpa_4, total_credits, raw_data, last_synced_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        student_code = excluded.student_code,
        full_name = excluded.full_name,
        major = excluded.major,
        class_name = excluded.class_name,
        gpa_10 = excluded.gpa_10,
        gpa_4 = excluded.gpa_4,
        total_credits = excluded.total_credits,
        raw_data = excluded.raw_data,
        last_synced_at = excluded.last_synced_at
    `).bind(
      user.userId,
      processed.student.ma_sinh_vien || "",
      processed.student.ho_ten || "",
      processed.student.nganh || "",
      processed.student.lop || "",
      processed.gpa.overall_10 || 0,
      processed.gpa.overall_4 || 0,
      processed.gpa.total_credits || 0,
      rawDataJson,
      now,
      now
    ).run();
  } catch (err) {
    console.warn("[Academic DB Import]", err.message);
  }

  return { ok: true, transcript: processed, lastSyncedAt: now };
}

async function handleGetAcademicTranscript(user, env) {
  try {
    const row = await env.DB.prepare(`
      SELECT student_code, full_name, major, class_name, gpa_10, gpa_4, total_credits, raw_data, ai_analysis, target_gpa, last_synced_at
      FROM user_academic_transcripts WHERE user_id = ? LIMIT 1
    `).bind(user.userId).first();

    if (!row || !row.raw_data) {
      return { hasTranscript: false, transcript: null };
    }

    const transcript = JSON.parse(row.raw_data);
    return {
      hasTranscript: true,
      transcript,
      aiAnalysis: row.ai_analysis || null,
      targetGpa: row.target_gpa || 3.2,
      lastSyncedAt: row.last_synced_at
    };
  } catch (err) {
    console.warn("[Get Academic Transcript]", err.message);
    return { hasTranscript: false, transcript: null };
  }
}

async function handleAcademicAdvisor(request, user, env) {
  const body = await readJson(request);
  const targetGpa = Number(body.targetGpa) || 3.2;

  let transcriptData = null;
  try {
    const row = await env.DB.prepare(`
      SELECT raw_data FROM user_academic_transcripts WHERE user_id = ? LIMIT 1
    `).bind(user.userId).first();
    if (row && row.raw_data) {
      transcriptData = JSON.parse(row.raw_data);
    }
  } catch {}

  if (!transcriptData && body.transcript) {
    transcriptData = body.transcript;
  }

  if (!transcriptData) {
    throw new HttpError(400, "Chưa có dữ liệu bảng điểm để AI DeepSeek phân tích. Vui lòng kết nối tài khoản IU trước nhé!");
  }

  const advice = await generateAcademicAdvisorPlan(transcriptData, targetGpa, env);

  try {
    await env.DB.prepare(`
      UPDATE user_academic_transcripts
      SET ai_analysis = ?, target_gpa = ?
      WHERE user_id = ?
    `).bind(advice, targetGpa, user.userId).run();
  } catch (err) {
    console.warn("[Save Academic Advisor]", err.message);
  }

  return { ok: true, advice, targetGpa };
}

async function createSession(request, env) {
  const existing = await sessionUser(request, env);
  if (existing) return respond({ profile: existing.profile, existing: true });
  const userId = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO profiles (user_id, full_name, avatar_url) VALUES (?, 'Bạn học mới', NULL)").bind(userId),
    env.DB.prepare("INSERT INTO user_stats (user_id, total_xp, current_streak, longest_streak, hearts, gems) VALUES (?, 0, 0, 0, 5, 0)").bind(userId)
  ]);
  const profile = await env.DB.prepare(
    "SELECT id, user_id, full_name, avatar_url FROM profiles WHERE user_id = ? LIMIT 1"
  ).bind(userId).first();
  return respond(
    { profile: profile, existing: false },
    200,
    { "set-cookie": cookieHeader(request, userId, COOKIE_AGE) }
  );
}

async function routeApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS, PATCH, DELETE",
        "access-control-allow-headers": "content-type, authorization"
      }
    });
  }
  if (method === "GET" && path === "/api/health") return respond({ ok: true });
  if (method === "GET" && path === "/api/subjects") return respond({ subjects: await apiSubjects(env) });
  if (path === "/api/session" && method === "POST") return createSession(request, env);
  if (path === "/api/session" && method === "GET") {
    const user = await sessionUser(request, env);
    return user ? respond({ profile: user.profile }) : respond({ error: "Chưa có hồ sơ học tập." }, 401);
  }
  if (path === "/api/session" && method === "DELETE") {
    return respond({ ok: true }, 200, { "set-cookie": cookieHeader(request, "", 0) });
  }
  if (path === "/api/auth/register" && method === "POST") return registerAccount(request, env);
  if (path === "/api/auth/login" && method === "POST") return loginAccount(request, env);
  if (path === "/api/auth/logout" && method === "POST") {
    return respond({ ok: true }, 200, { "set-cookie": cookieHeader(request, "", 0) });
  }
  const publicSubjectMatch = path.match(/^\/api\/subjects\/(\d+)$/);
  if (publicSubjectMatch && method === "GET") {
    const visitor = await sessionUser(request, env);
    return respond(await subjectDetails(Number(publicSubjectMatch[1]), visitor ? visitor.userId : null, env));
  }
  if (path === "/api/academic/import-data" && method === "POST") {
    let visitor = await sessionUser(request, env);
    if (!visitor) {
      const lastUser = await env.DB.prepare("SELECT user_id FROM profiles ORDER BY id DESC LIMIT 1").first();
      visitor = lastUser ? { userId: lastUser.user_id } : { userId: "default_student" };
    }
    return respond(await handleAcademicImportData(request, visitor, env));
  }
  const user = await requireUser(request, env);
  if (path === "/api/academic/login-iu" && method === "POST") return respond(await handleAcademicLoginIU(request, user, env));
  if (path === "/api/academic/transcript" && method === "GET") return respond(await handleGetAcademicTranscript(user, env));
  if (path === "/api/academic/advisor" && method === "POST") return respond(await handleAcademicAdvisor(request, user, env));
  if (path === "/api/me" && method === "GET") {
    const stats = await env.DB.prepare("SELECT * FROM user_stats WHERE user_id = ? LIMIT 1").bind(user.userId).first();
    const inv = await env.DB.prepare("SELECT item_code, quantity FROM user_inventory WHERE user_id = ?").bind(user.userId).all();
    return respond({ profile: user.profile, stats: stats || {}, inventory: inv.results || [] });
  }
  if (path === "/api/overview" && method === "GET") return respond(await overview(user, env));
  if (path === "/api/notes" && method === "GET") return respond(await listNotes(request, user, env));
  if (path === "/api/notes" && method === "POST") return respond(await saveNote(request, user, env));
  const noteMatch = path.match(/^\/api\/notes\/(\d+)$/);
  if (noteMatch && method === "PATCH") return respond(await saveNote(request, user, env, Number(noteMatch[1])));
  if (noteMatch && method === "DELETE") return respond(await deleteNote(Number(noteMatch[1]), user, env));
  if (path === "/api/profile" && method === "PATCH") return respond({ profile: await updateProfile(request, user, env) });
  if (path === "/api/profile/avatar" && method === "POST") return respond({ profile: await uploadAvatar(request, user, env) });
  if (path === "/api/profile/avatar/preset" && method === "POST") return respond({ profile: await setPresetAvatar(request, user, env) });
  if (path === "/api/profile/avatar" && method === "DELETE") return respond(await removeAvatar(user, env));
  if (path === "/api/profile/cover" && method === "POST") return respond({ profile: await updateCover(request, user, env) });
  if (path === "/api/review" && method === "GET") return respond({ mistakes: await reviewList(user, env) });
  if (path === "/api/review/solve" && method === "POST") return respond(await solveMistake(request, user, env));
  if (path === "/api/shop" && method === "GET") return respond(await shopList(user, env));
  if (path === "/api/shop/buy" && method === "POST") return respond(await buyShopItem(request, user, env));
  if (path === "/api/achievements" && method === "GET") return respond(await achievementsList(user, env));
  if (path === "/api/quests/daily" && method === "GET") return respond(await getDailyQuests(user, env));
  if (path === "/api/quests/claim" && method === "POST") return respond(await claimDailyQuest(request, user, env));
  if (path === "/api/leaderboard" && method === "GET") return respond(await leaderboard(user, env));
  if (path === "/api/leaderboard/claim" && method === "POST") return respond(await claimLeaderboardReward(request, user, env));
  const userMatch = path.match(/^\/api\/users\/([0-9a-f-]{36})$/i);
  if (userMatch && method === "GET") return respond(await getUserPublicProfile(userMatch[1], user, env));
  if (path === "/api/friends" && method === "GET") return respond(await getFriendsList(user, env));
  if (path === "/api/friends/toggle" && method === "POST") return respond(await toggleFriend(request, user, env));
  if (path === "/api/friends/search" && method === "GET") return respond(await searchUsers(request, user, env));
  if (path === "/api/messages/conversations" && method === "GET") return respond(await getConversations(user, env));
  const messageMatch = path.match(/^\/api\/messages\/([0-9a-f-]{36})$/i);
  if (messageMatch && method === "GET") return respond(await getMessagesWithUser(messageMatch[1], user, env));
  if (messageMatch && method === "POST") return respond(await sendMessageToUser(request, messageMatch[1], user, env));
  if (path === "/api/chat/conversations" && method === "GET") return respond(await listAiConversations(user, env));
  const conversationMatch = path.match(/^\/api\/chat\/conversations\/([0-9a-f-]{36})$/i);
  if (conversationMatch && method === "GET") return respond(await readAiConversation(conversationMatch[1], user, env));
  if (path === "/api/chat" && method === "POST") return respond(await askAI(request, user, env));
  const lessonMatch = path.match(/^\/api\/lessons\/(\d+)$/);
  if (lessonMatch && method === "GET") return respond(await lessonData(Number(lessonMatch[1]), user.userId, env));
  const checkMatch = path.match(/^\/api\/lessons\/(\d+)\/check$/);
  if (checkMatch && method === "POST") {
    const body = await readJson(request);
    const lessonId = Number(checkMatch[1]);
    const result = await env.DB.prepare(
      "WITH current_lesson AS (" +
        "SELECT l.id, l.order_index AS lesson_order, u.id AS unit_id, u.order_index AS unit_order, u.subject_id " +
        "FROM lessons l JOIN units u ON u.id = l.unit_id WHERE l.id = ?" +
      "), previous_lesson AS (" +
        "SELECT prior.id FROM current_lesson current_row " +
        "JOIN units prior_unit ON prior_unit.subject_id = current_row.subject_id " +
        "JOIN lessons prior ON prior.unit_id = prior_unit.id " +
        "WHERE prior_unit.order_index < current_row.unit_order " +
          "OR (prior_unit.order_index = current_row.unit_order AND prior_unit.id < current_row.unit_id) " +
          "OR (prior_unit.order_index = current_row.unit_order AND prior_unit.id = current_row.unit_id AND prior.order_index < current_row.lesson_order) " +
          "OR (prior_unit.order_index = current_row.unit_order AND prior_unit.id = current_row.unit_id AND prior.order_index = current_row.lesson_order AND prior.id < current_row.id) " +
        "ORDER BY prior_unit.order_index DESC, prior_unit.id DESC, prior.order_index DESC, prior.id DESC LIMIT 1" +
      "), authorized_lesson AS (" +
        "SELECT current_row.id FROM current_lesson current_row WHERE " +
          "EXISTS (SELECT 1 FROM user_progress completed WHERE completed.user_id = ? AND completed.lesson_id = current_row.id AND completed.status = 'completed') " +
          "OR NOT EXISTS (SELECT 1 FROM previous_lesson) " +
          "OR EXISTS (SELECT 1 FROM previous_lesson previous JOIN user_progress progress ON progress.lesson_id = previous.id " +
            "WHERE progress.user_id = ? AND progress.status = 'completed')" +
      ") " +
      "SELECT (SELECT id FROM authorized_lesson LIMIT 1) AS authorized_lesson_id, " +
      "question.id AS question_id, question.correct_answer, question.explanation " +
      "FROM (SELECT 1) AS seed " +
      "LEFT JOIN questions question ON question.id = ? " +
        "AND EXISTS (SELECT 1 FROM authorized_lesson) " +
        "AND EXISTS (SELECT 1 FROM current_lesson current_row JOIN lessons source_lesson ON source_lesson.id = question.lesson_id " +
          "JOIN units source_unit ON source_unit.id = source_lesson.unit_id WHERE source_unit.subject_id = current_row.subject_id)"
    ).bind(lessonId, user.userId, user.userId, body.questionId).first();
    if (!result?.authorized_lesson_id) {
      throw new HttpError(423, "Hoàn thành bài trước để mở khóa bài này nhé.");
    }
    if (!result.question_id) throw new HttpError(404, "Không tìm thấy câu hỏi này.");
    return respond({
      isCorrect: normalizeAnswer(body.selected) !== "" && normalizeAnswer(body.selected) === normalizeAnswer(result.correct_answer),
      correctAnswer: normalizeAnswer(result.correct_answer),
      explanation: result.explanation || ""
    });
  }
  const submitMatch = path.match(/^\/api\/lessons\/(\d+)\/submit$/);
  if (submitMatch && method === "POST") return respond(await submitLesson(request, Number(submitMatch[1]), user, env));
  return respond({ error: "Không tìm thấy đường dẫn này." }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/media/")) return await serveMedia(url.pathname, env);
      if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
      const scopedEnv = {
        ...env,
        DB: (env.DB && env.DB.__isRemoteD1) ? env.DB : createRemoteD1(env, env.DB)
      };
      return await routeApi(request, scopedEnv);
    } catch (error) {
      if (error instanceof HttpError) return respond({ error: error.message }, error.status);
      console.error("3TG API error", error && error.message ? error.message : "unknown");
      return respond({ error: "3TG gặp trục trặc khi tải dữ liệu. Bạn thử lại nhé." }, 500);
    }
  }
};
