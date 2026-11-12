import { loginIUPortal, layBangDiemVaHoSoIU, processAcademicTranscript, generateAcademicAdvisorPlan, mergeAndDeduplicateActiveCourses } from "./academic_service.js";
import { BOT_ID, BOT_NAME, BOT_AVATAR, BOT_DECORATION, handleBot3TgCommand } from "./bot3tg.js";

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

const userLastActiveMap = new Map();

async function sessionUser(request, env) {
  const userId = getCookie(request, COOKIE_NAME);
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return null;
  const account = await env.DB.prepare(
    "SELECT a.id AS account_id, a.username, a.created_at AS account_created_at, p.id AS profile_id, p.full_name, p.avatar_url, p.avatar_decoration, p.profile_effect, p.profile_theme, p.bio, p.cover_url, p.school, p.major, p.created_at AS profile_created_at, p.last_active_at " +
    "FROM accounts a LEFT JOIN profiles p ON p.user_id = a.user_id " +
    "WHERE a.user_id = ? LIMIT 1"
  ).bind(userId).first();
  if (!account) return null;

  // Throttled update of last_active_at (once every 30s)
  const nowMs = Date.now();
  const lastActiveTimestamp = userLastActiveMap.get(userId) || 0;
  if (nowMs - lastActiveTimestamp > 30000) {
    userLastActiveMap.set(userId, nowMs);
    const nowIso = new Date().toISOString();
    env.DB.prepare("UPDATE profiles SET last_active_at = ? WHERE user_id = ?").bind(nowIso, userId).run().catch(() => {});
  }

  const profile = {
    id: account.profile_id || account.account_id,
    user_id: userId,
    full_name: account.full_name || account.username,
    avatar_url: account.avatar_url,
    avatar_decoration: account.avatar_decoration || null,
    profile_effect: account.profile_effect || null,
    profile_theme: account.profile_theme || null,
    bio: account.bio || "",
    cover_url: account.cover_url || "",
    school: account.school || "",
    major: account.major || "",
    created_at: account.profile_created_at || account.account_created_at || "",
    last_active_at: account.last_active_at || account.profile_created_at || new Date().toISOString(),
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
  const reward = Math.max(5, Math.round((Number(lesson.xp_reward) || 20) * Math.max(0.4, correct / total)));
  // Kim cương: Tối đa 30 tương đương 100 điểm và giảm dần khi điểm thấp dần
  const gemReward = score > 0 ? Math.max(1, Math.round((score / 100) * 30)) : 1;
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
      "UPDATE user_progress SET status = 'completed', score = MAX(score, ?), completed_at = ? WHERE id = ?"
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
  const avatarUrl = String(body.avatarUrl || body.preset || "").trim();
  if (!avatarUrl) throw new HttpError(400, "Chọn một hình đại diện.");
  await env.DB.prepare("UPDATE profiles SET avatar_url = ? WHERE user_id = ?").bind(avatarUrl, user.userId).run();
  user.profile.avatar_url = avatarUrl;
  return Object.assign({}, user.profile, { avatar_url: avatarUrl });
}

const SHOP_PROFILE_ITEMS = [
  { item_code: "deco_sakura_bloom", name: "Vòng Hoa Anh Đào Sakura", description: "Cánh hoa anh đào lượn sóng xoay vòng và rơi lấp lánh nhẹ nhàng quanh ảnh đại diện.", price_gems: 100, type: "avatar_decoration" },
  { item_code: "deco_hello_kitty", name: "Khung Hello Kitty Kawaii Nơ Đỏ", description: "Khung nơ đỏ Hello Kitty siêu cấp đáng yêu với tai mèo trắng, ria mèo xinh xắn và ánh sao hồng lấp lánh.", price_gems: 100, type: "avatar_decoration" },
  { item_code: "deco_flame_dragon", name: "Hào Quang Hỏa Long Siêu Cấp", description: "Ngọn lửa rực cháy đỏ cam bập bùng dữ dội bao quanh avatar cực kỳ chiến và nổi bật.", price_gems: 100, type: "avatar_decoration" },
  { item_code: "deco_cyber_neon", name: "Khung Neon Cyberpunk 2077", description: "Vòng xoay năng lượng công nghệ cao phát quang tia sét neon xanh lam & tím rực rỡ chuẩn Discord Nitro.", price_gems: 100, type: "avatar_decoration" },
  { item_code: "deco_kuromi_punk", name: "Khung Kuromi Gothic Punk", description: "Phong cách tiểu quỷ Kuromi tím đen cá tính với tai thỏ ác quỷ, đầu lâu mini và gai hoa hồng neon.", price_gems: 100, type: "avatar_decoration" },
  { item_code: "deco_cyber_mecha", name: "Khung Chiến Giáp Mecha Sci-Fi", description: "Vòng radar ngắm bắn công nghệ cao Gundam với giáp lục giác kim loại và lưỡi dao năng lượng plasma cực ngầu.", price_gems: 100, type: "avatar_decoration" },
  { item_code: "deco_galaxy_portal", name: "Cổng Vũ Trụ Tinh Vân Galaxy", description: "Vòng xoáy không gian vũ trụ huyền ảo với bụi sao lấp lánh và tinh vân xoay tròn kỳ ảo.", price_gems: 100, type: "avatar_decoration" },
  { item_code: "deco_frost_phoenix", name: "Khung Băng Phong Tuyết Vũ", description: "Vòng pha lê băng giá vĩnh cửu phát quang ánh tuyết xanh ngọc cùng những bông tuyết kim cương xoay tròn.", price_gems: 100, type: "avatar_decoration" },
  { item_code: "deco_blood_moon", name: "Khung Dạ Nguyệt Huyết Ma", description: "Trăng máu đỏ thẫm huyền bí cùng đôi cánh dơi ma cà rồng gothic và ngọc huyết quang rực cháy.", price_gems: 100, type: "avatar_decoration" },
  { item_code: "deco_manga_ghoul", name: "Quỷ Hồn Hắc Ám (Manga Ghoul)", description: "Linh hồn quỷ dị và bàn tay xương xẩu manga kinh dị Junji Ito ôm lấy avatar cực kỳ ma mị chuẩn Discord VIP.", price_gems: 100, type: "avatar_decoration" },
  { item_code: "deco_susanoo_demon", name: "Khung Ma Thần Susanoo Hắc Hỏa", description: "Hào quang Ma Thần Susanoo tím thẫm rực cháy với sừng quỷ giác đấu và ngọn lửa chakra hắc ám cuộn trào.", price_gems: 100, type: "avatar_decoration" },
  { item_code: "bg_meow_doodle", name: "Hình Nền: Mèo Doodle Hài Hước", description: "Bản vẽ vẽ tay phác họa chú mèo ngộ nghĩnh hài hước, tạo cảm giác thư giãn gần gũi.", price_gems: 100, type: "wallpaper", cover_url: "/media/hinhnen/meow-doodle.jpeg" },
  { item_code: "bg_2b_monochrome", name: "Hình Nền: 2B Nier Tối Giản", description: "Hình nền nghệ thuật 2B NieR:Automata phong cách đen trắng đơn sắc huyền bí, sang trọng.", price_gems: 100, type: "wallpaper", cover_url: "/media/hinhnen/2b-monochrome.webp" },
  { item_code: "bg_sakura_pastel", name: "Hình Nền: Hoa Anh Đào Pastel", description: "Cảnh sắc hoa anh đào rực rỡ tông màu hồng pastel ngọt ngào, đậm chất anime lãng mạn.", price_gems: 100, type: "wallpaper", cover_url: "/media/hinhnen/pink-cherry-blossoms-sakura-pastel.webp" },
  { item_code: "bg_sakura_canopy", name: "Hình Nền: Vòm Tán Hoa Anh Đào", description: "Tán hoa anh đào bung nở rợp bóng trời xuân Nhật Bản, tươi sáng và tràn ngập sinh khí.", price_gems: 100, type: "wallpaper", cover_url: "/media/hinhnen/sakura-canopy.webp" },
  { item_code: "bg_purple_moon", name: "Hình Nền: Trăng Tím Mộng Mơ", description: "Vầng trăng tím phát sáng giữa dải ngân hà tĩnh mịch, tông màu chill êm dịu.", price_gems: 100, type: "wallpaper", cover_url: "/media/hinhnen/purple-moon.webp" },
  { item_code: "bg_storm_cloudscape", name: "Hình Nền: Mây Bão Hoàng Hôn", description: "Bầu trời bão mây cuồn cuộn pha trộn giữa ánh cam hoàng hôn và sắc hồng rực rỡ tráng lệ.", price_gems: 100, type: "wallpaper", cover_url: "/media/hinhnen/pink-orange-storm-cloudscape-text.webp" },
  { item_code: "bg_purple_gaze", name: "Hình Nền: Ánh Nhìn Tím Huyền Bí", description: "Ánh mắt anime tím biếc sâu thẳm đầy cuốn hút trong màn đêm huyền ảo.", price_gems: 100, type: "wallpaper", cover_url: "/media/hinhnen/purple-gaze.webp" },
  { item_code: "bg_wing_shadow", name: "Hình Nền: Đôi Cánh Bóng Đêm", description: "Hình tượng đôi cánh sải rộng giữa ánh sáng mờ ảo, tạo chiều sâu nghệ thuật độc đáo.", price_gems: 100, type: "wallpaper", cover_url: "/media/hinhnen/wing-shadow.webp" },
  { item_code: "bg_cartoon_white_bird", name: "Hình Nền Động: Chim Trắng Cute (GIF)", description: "Hoạt ảnh chú chim trắng chibi nhấp nháy dễ thương trên nền tối tối giản phong cách hoạt hình.", price_gems: 100, type: "wallpaper", cover_url: "/media/hinhnen/cartoon-white-bird-dark-background.gif" },
  { item_code: "bg_rainy_rooftop", name: "Hình Nền Động: Mưa Trên Mái Nhà (GIF)", description: "Ảnh động mưa rơi tí tách trên sân thượng thành phố về đêm phong cách Lo-Fi chill thư giãn.", price_gems: 100, type: "wallpaper", cover_url: "/media/hinhnen/rainy-rooftop.gif" },
  { item_code: "bg_sakura_bridge", name: "Hình Nền Động: Cầu Hoa Anh Đào (GIF)", description: "Ảnh động cầu gỗ cổ kính soi bóng dòng sông dưới tán hoa anh đào bay lượn tuyệt đẹp.", price_gems: 100, type: "wallpaper", cover_url: "/media/hinhnen/sakura-bridge.gif" },
  { item_code: "bg_goth_smoker", name: "Hình Nền Động: Goth Girl Khói Thuốc (GIF)", description: "Ảnh động cô gái phong cách gothic khói thuốc mờ ảo, nét vẽ anime vintage hoài niệm cực chất.", price_gems: 100, type: "wallpaper", cover_url: "/media/hinhnen/goth-smoker.gif" },
  { item_code: "bg_anime_girl_windblown", name: "Hình Nền Động: Thiếu Nữ Gió Lộng (GIF)", description: "Ảnh động cô gái anime đứng bên hàng rào với mái tóc tung bay trong gió đầy cảm xúc.", price_gems: 100, type: "wallpaper", cover_url: "/media/hinhnen/windblown-anime-girl-fence-monochrome.gif" },
  { item_code: "bg_winged_maiden", name: "Hình Nền Động: Nàng Tiên Cánh Trắng (GIF)", description: "Ảnh động thiếu nữ với đôi cánh lấp lánh cử động mềm mại bay bổng tựa thiên thần.", price_gems: 100, type: "wallpaper", cover_url: "/media/hinhnen/winged-maiden.gif" }
];
const SHOP_PROFILE_ITEMS_BY_CODE = new Map(SHOP_PROFILE_ITEMS.map(function (item) { return [item.item_code, item]; }));

async function updateCover(request, user, env) {
  const body = await readJson(request);
  const coverUrl = String(body.coverUrl || "").trim();
  if (!coverUrl) throw new HttpError(400, "Chọn một ảnh bìa.");

  // Check if coverUrl is a premium shop wallpaper from R2
  if (coverUrl.startsWith("/media/hinhnen/") || coverUrl.startsWith("bg_")) {
    const wpItem = Array.from(SHOP_PROFILE_ITEMS_BY_CODE.values()).find(function (it) {
      return it.type === "wallpaper" && (it.cover_url === coverUrl || it.item_code === coverUrl);
    });
    if (wpItem) {
      const owned = await env.DB.prepare(
        "SELECT id FROM user_inventory WHERE user_id = ? AND (item_code = ? OR item_code = ?) AND quantity > 0 LIMIT 1"
      ).bind(user.userId, wpItem.item_code, coverUrl).first();
      if (!owned) {
        throw new HttpError(400, "Bạn chưa sở hữu hình nền này! Hãy vào Cửa hàng mua bằng Đá quý trước nhé. 🌄💎");
      }
    }
  }

  await env.DB.prepare("UPDATE profiles SET cover_url = ? WHERE user_id = ?").bind(coverUrl, user.userId).run();
  user.profile.cover_url = coverUrl;
  if (typeof invalidateD1QueryCache === "function") {
    invalidateD1QueryCache();
  }
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

async function equipDecoration(request, user, env) {
  const body = await readJson(request);
  const type = String(body.type || "avatar_decoration").trim();
  const itemCode = body.itemCode ? String(body.itemCode).trim() : null;

  const expectedType = SHOP_PROFILE_ITEMS_BY_CODE.get(itemCode)?.type;
  const isWpType = type === "wallpaper" || type === "profile_cover" || type === "cover";
  if (type !== "avatar_decoration" && type !== "profile_effect" && type !== "profile_theme" && !isWpType) {
    throw new HttpError(400, "Loại hiệu ứng hồ sơ không hợp lệ.");
  }
  if (expectedType && type !== expectedType && !(expectedType === "wallpaper" && isWpType)) {
    throw new HttpError(400, "Hiệu ứng này không đúng loại hồ sơ.");
  }

  if (itemCode) {
    const wpByUrl = isWpType ? Array.from(SHOP_PROFILE_ITEMS_BY_CODE.values()).find(function (it) { return it.cover_url === itemCode; }) : null;
    const lookupCode = wpByUrl ? wpByUrl.item_code : itemCode;

    // Strictly check if the user actually owns this item in user_inventory!
    const owned = await env.DB.prepare(
      "SELECT id FROM user_inventory WHERE user_id = ? AND (item_code = ? OR item_code = ?) AND quantity > 0 LIMIT 1"
    ).bind(user.userId, lookupCode, itemCode).first();
    if (!owned) {
      throw new HttpError(400, "Bạn chưa sở hữu vật phẩm này! Hãy vào Cửa hàng mua bằng Đá quý trước nhé. 💎");
    }
  }

  if (type === "avatar_decoration") {
    await env.DB.prepare("UPDATE profiles SET avatar_decoration = ? WHERE user_id = ?").bind(itemCode, user.userId).run();
    user.profile.avatar_decoration = itemCode;
  } else if (type === "profile_effect") {
    await env.DB.prepare("UPDATE profiles SET profile_effect = ? WHERE user_id = ?").bind(itemCode, user.userId).run();
    user.profile.profile_effect = itemCode;
  } else if (type === "profile_theme") {
    await env.DB.prepare("UPDATE profiles SET profile_theme = ? WHERE user_id = ?").bind(itemCode, user.userId).run();
    user.profile.profile_theme = itemCode;
  } else if (isWpType) {
    const wp = itemCode ? (SHOP_PROFILE_ITEMS_BY_CODE.get(itemCode) || Array.from(SHOP_PROFILE_ITEMS_BY_CODE.values()).find(function (it) { return it.cover_url === itemCode; })) : null;
    const coverUrl = itemCode ? (wp && wp.cover_url ? wp.cover_url : itemCode) : null;
    await env.DB.prepare("UPDATE profiles SET cover_url = ? WHERE user_id = ?").bind(coverUrl, user.userId).run();
    user.profile.cover_url = coverUrl;
  }

  if (typeof invalidateD1QueryCache === "function") {
    invalidateD1QueryCache();
  }

  return { ok: true, profile: user.profile, message: itemCode ? "Đã trang bị thành công! ✨" : "Đã tháo trang bị." };
}

async function serveMedia(path, env) {
  if (!env.AVATARS) return new Response("Not found", { status: 404 });
  let key;
  try {
    key = decodeURIComponent(path.slice("/media/".length));
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if ((!key.startsWith("avatars/") && !key.startsWith("hinhnen/") && !key.startsWith("chat_files/")) || key.includes("..") || key.includes("\\")) {
    return new Response("Not found", { status: 404 });
  }
  const object = await env.AVATARS.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  if (!headers.get("content-type") || headers.get("content-type") === "application/octet-stream") {
    const lk = key.toLowerCase();
    if (lk.endsWith(".gif")) headers.set("content-type", "image/gif");
    else if (lk.endsWith(".webp")) headers.set("content-type", "image/webp");
    else if (lk.endsWith(".jpg") || lk.endsWith(".jpeg")) headers.set("content-type", "image/jpeg");
    else if (lk.endsWith(".png")) headers.set("content-type", "image/png");
    else if (lk.endsWith(".svg")) headers.set("content-type", "image/svg+xml");
    else if (lk.endsWith(".mp4")) headers.set("content-type", "video/mp4");
    else if (lk.endsWith(".webm")) headers.set("content-type", "video/webm");
    else if (lk.endsWith(".mp3")) headers.set("content-type", "audio/mpeg");
    else if (lk.endsWith(".wav")) headers.set("content-type", "audio/wav");
    else if (lk.endsWith(".ogg")) headers.set("content-type", "audio/ogg");
    else if (lk.endsWith(".m4a")) headers.set("content-type", "audio/mp4");
    else if (lk.endsWith(".pdf")) headers.set("content-type", "application/pdf");
    else if (lk.endsWith(".zip")) headers.set("content-type", "application/zip");
  }
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
    "SELECT id FROM accounts WHERE LOWER(username) = LOWER(?) LIMIT 1"
  ).bind(username).first();
  if (existingAccount) {
    throw new HttpError(409, `Tên đăng nhập "${username}" đã được sử dụng. Hãy chọn một tên khác nhé.`);
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
    "SELECT id, user_id, full_name, avatar_url, avatar_decoration, profile_effect, profile_theme, bio, cover_url, school, major, created_at FROM profiles WHERE user_id = ? LIMIT 1"
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
  const itemsByCode = new Map((itemsRes.results || []).map(function (item) { return [item.item_code, item]; }));
  for (const profItem of SHOP_PROFILE_ITEMS) {
    const storedItem = itemsByCode.get(profItem.item_code);
    if (!storedItem) {
      try {
        await env.DB.prepare(
          "INSERT OR IGNORE INTO shop_items (item_code, name, description, price_gems) VALUES (?, ?, ?, ?)"
        ).bind(profItem.item_code, profItem.name, profItem.description || "", profItem.price_gems).run();
      } catch (seedErr) {}
    }
    const finalPrice = storedItem ? Number(storedItem.price_gems) : profItem.price_gems;
    itemsByCode.set(profItem.item_code, Object.assign({}, storedItem || {}, profItem, {
      id: storedItem ? storedItem.id : null,
      price_gems: finalPrice
    }));
  }
  const items = Array.from(itemsByCode.values()).map(function (item) {
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
  const storedItem = await env.DB.prepare(
    "SELECT id, item_code, name, price_gems FROM shop_items WHERE item_code = ? LIMIT 1"
  ).bind(itemCode).first();
  const profItem = SHOP_PROFILE_ITEMS_BY_CODE.get(itemCode);
  const item = profItem
    ? Object.assign({}, storedItem || {}, profItem, {
        id: storedItem ? storedItem.id : null,
        price_gems: storedItem ? Number(storedItem.price_gems) : profItem.price_gems
      })
    : storedItem;
  if (!item) throw new HttpError(404, "Vật phẩm không tồn tại trong Cửa hàng.");

  const itemPrice = Number(item.price_gems) || 0;
  const stats = await env.DB.prepare(
    "SELECT * FROM user_stats WHERE user_id = ? LIMIT 1"
  ).bind(user.userId).first();
  const currentGems = Number(stats && stats.gems) || 0;
  if (currentGems < itemPrice) {
    throw new HttpError(400, "Bạn không đủ Đá quý. Cần " + itemPrice + " 💎 nhưng bạn chỉ có " + currentGems + " 💎.");
  }

  const existingInv = await env.DB.prepare(
    "SELECT id, quantity FROM user_inventory WHERE user_id = ? AND item_code = ? LIMIT 1"
  ).bind(user.userId, itemCode).first();
  if ((itemCode.startsWith("mascot_") || itemCode.startsWith("deco_") || itemCode.startsWith("fx_") || itemCode.startsWith("bg_")) && existingInv && Number(existingInv.quantity) >= 1) {
    throw new HttpError(400, "Bạn đã sở hữu vật phẩm này rồi, không thể mua lại!");
  }

  const ops = [];
  if (itemPrice > 0) {
    ops.push(env.DB.prepare("UPDATE user_stats SET gems = gems - ? WHERE user_id = ?").bind(itemPrice, user.userId));
  }
  if (itemCode === "refill_hearts") {
    ops.push(env.DB.prepare("UPDATE user_stats SET hearts = 5 WHERE user_id = ?").bind(user.userId));
  }
  if (!storedItem && profItem) {
    try {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO shop_items (item_code, name, description, price_gems) VALUES (?, ?, ?, ?)"
      ).bind(profItem.item_code, profItem.name, profItem.description || "", profItem.price_gems).run();
    } catch (seedErr) {
      console.warn("Auto-seed profItem in buyShopItem error:", seedErr.message);
    }
  }

  if (existingInv) {
    ops.push(env.DB.prepare("UPDATE user_inventory SET quantity = quantity + 1 WHERE id = ?").bind(existingInv.id));
  } else {
    ops.push(env.DB.prepare("INSERT INTO user_inventory (user_id, item_code, quantity) VALUES (?, ?, 1)").bind(user.userId, itemCode));
  }

  // Auto-equip purchased decoration or wallpaper directly in database
  if (itemCode.startsWith("deco_")) {
    ops.push(env.DB.prepare("UPDATE profiles SET avatar_decoration = ? WHERE user_id = ?").bind(itemCode, user.userId));
    user.profile.avatar_decoration = itemCode;
  } else if (itemCode.startsWith("fx_")) {
    ops.push(env.DB.prepare("UPDATE profiles SET profile_effect = ? WHERE user_id = ?").bind(itemCode, user.userId));
    user.profile.profile_effect = itemCode;
  } else if (itemCode.startsWith("bg_")) {
    const wpItem = profItem || Array.from(SHOP_PROFILE_ITEMS_BY_CODE.values()).find(function (it) { return it.cover_url === itemCode; });
    const coverUrl = wpItem ? wpItem.cover_url : itemCode;
    ops.push(env.DB.prepare("UPDATE profiles SET cover_url = ? WHERE user_id = ?").bind(coverUrl, user.userId));
    user.profile.cover_url = coverUrl;
  }

  if (typeof env.DB.batch === "function") {
    try {
      await env.DB.batch(ops);
    } catch (bErr) {
      for (const op of ops) {
        if (typeof op.run === "function") await op.run();
        else if (typeof op.all === "function") await op.all();
      }
    }
  } else {
    for (const op of ops) {
      if (typeof op.run === "function") await op.run();
      else if (typeof op.all === "function") await op.all();
    }
  }

  if (typeof invalidateD1QueryCache === "function") {
    invalidateD1QueryCache();
  }

  const updatedStats = await env.DB.prepare("SELECT * FROM user_stats WHERE user_id = ? LIMIT 1").bind(user.userId).first();
  const shopData = await shopList(user, env);
  return { ok: true, message: "Đã mua thành công " + item.name + "!", stats: updatedStats, profile: user.profile, shop: shopData };
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
  // Mỗi bài học hoàn thành đạt 25 XP, mỗi câu sai ôn tập khắc phục đạt 10 XP
  const xpCount = (lessonsCount * 25) + (mistakesCount * 10);

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
    "SELECT w.user_id, COALESCE(p.full_name, a.username, 'Học viên 3TG') AS full_name, p.avatar_url, p.avatar_decoration, p.profile_effect, p.cover_url, w.league_name, w.weekly_xp " +
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
    "SELECT p.id, p.user_id, p.full_name, p.avatar_url, p.avatar_decoration, p.profile_effect, p.profile_theme, p.bio, p.cover_url, p.school, p.major, p.created_at, p.last_active_at, a.username " +
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
    "SELECT id, user_id, friend_id, status FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?) LIMIT 1"
  ).bind(currentUser.userId, targetUserId, targetUserId, currentUser.userId).first();

  let friendStatus = "none";
  if (friend) {
    if (friend.status === "accepted") {
      friendStatus = "accepted";
    } else if (friend.status === "pending") {
      friendStatus = (friend.user_id === currentUser.userId) ? "pending_sent" : "pending_received";
    }
  }

  return {
    profile: profile,
    stats: stats,
    league: lb?.league_name || "Bronze",
    weeklyXp: lb?.weekly_xp || 0,
    completedLessons: progress?.completed_count || 0,
    achievementsCount: ach?.ach_count || 0,
    isSelf: currentUser.userId === targetUserId,
    isFriend: friendStatus === "accepted",
    friendStatus: friendStatus,
    friendshipId: friend?.id || null
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
    "SELECT id, user_id, friend_id, status FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?) LIMIT 1"
  ).bind(currentUser.userId, targetUserId, targetUserId, currentUser.userId).first();

  const now = new Date().toISOString();
  if (existing) {
    if (existing.status === "accepted") {
      await env.DB.prepare("DELETE FROM friendships WHERE id = ?").bind(existing.id).run();
      return { isFriend: false, friendStatus: "none", message: "Đã hủy kết bạn thành công." };
    } else if (existing.status === "pending") {
      if (existing.user_id === currentUser.userId) {
        await env.DB.prepare("DELETE FROM friendships WHERE id = ?").bind(existing.id).run();
        return { isFriend: false, friendStatus: "none", message: "Đã hủy lời mời kết bạn." };
      } else {
        await env.DB.prepare("UPDATE friendships SET status = 'accepted', created_at = ? WHERE id = ?").bind(now, existing.id).run();
        return { isFriend: true, friendStatus: "accepted", message: "Đã chấp nhận kết bạn thành công! Giờ các bạn đã là bạn bè 🎉" };
      }
    }
  }

  await env.DB.prepare(
    "INSERT INTO friendships (user_id, friend_id, status, created_at) VALUES (?, ?, 'pending', ?)"
  ).bind(currentUser.userId, targetUserId, now).run();
  return { isFriend: false, friendStatus: "pending_sent", message: "Đã gửi lời mời kết bạn! Đang chờ bạn ấy đồng ý ⏳" };
}

async function acceptFriendRequest(request, currentUser, env) {
  const body = await readJson(request);
  const targetUserId = String(body.targetUserId || "").trim();
  if (!targetUserId) throw new HttpError(400, "Thiếu mã học viên.");

  const now = new Date().toISOString();
  const res = await env.DB.prepare(
    "UPDATE friendships SET status = 'accepted', created_at = ? WHERE user_id = ? AND friend_id = ? AND status = 'pending'"
  ).bind(now, targetUserId, currentUser.userId).run();

  return { ok: true, isFriend: true, friendStatus: "accepted", message: "Đã chấp nhận kết bạn thành công! 🎉" };
}

async function rejectFriendRequest(request, currentUser, env) {
  const body = await readJson(request);
  const targetUserId = String(body.targetUserId || "").trim();
  if (!targetUserId) throw new HttpError(400, "Thiếu mã học viên.");

  await env.DB.prepare(
    "DELETE FROM friendships WHERE (user_id = ? AND friend_id = ? AND status = 'pending') OR (user_id = ? AND friend_id = ? AND status = 'pending')"
  ).bind(targetUserId, currentUser.userId, currentUser.userId, targetUserId).run();

  return { ok: true, isFriend: false, friendStatus: "none", message: "Đã từ chối lời mời kết bạn." };
}

async function getFriendRequests(currentUser, env) {
  const incoming = await env.DB.prepare(
    "SELECT f.id AS friendship_id, f.user_id, f.created_at, " +
    "COALESCE(p.full_name, a.username, 'Học viên 3TG') AS full_name, " +
    "p.avatar_url, p.avatar_decoration, p.cover_url, p.school, p.major, a.username, " +
    "COALESCE(s.total_xp, 0) AS total_xp, COALESCE(s.current_streak, 0) AS current_streak " +
    "FROM friendships f " +
    "JOIN profiles p ON p.user_id = f.user_id " +
    "LEFT JOIN accounts a ON a.user_id = p.user_id " +
    "LEFT JOIN user_stats s ON s.user_id = p.user_id " +
    "WHERE f.friend_id = ? AND f.status = 'pending' " +
    "ORDER BY f.id DESC"
  ).bind(currentUser.userId).all();

  const outgoing = await env.DB.prepare(
    "SELECT f.id AS friendship_id, f.friend_id AS user_id, f.created_at, " +
    "COALESCE(p.full_name, a.username, 'Học viên 3TG') AS full_name, " +
    "p.avatar_url, p.avatar_decoration, p.cover_url, p.school, p.major, a.username, " +
    "COALESCE(s.total_xp, 0) AS total_xp, COALESCE(s.current_streak, 0) AS current_streak " +
    "FROM friendships f " +
    "JOIN profiles p ON p.user_id = f.friend_id " +
    "LEFT JOIN accounts a ON a.user_id = p.user_id " +
    "LEFT JOIN user_stats s ON s.user_id = p.user_id " +
    "WHERE f.user_id = ? AND f.status = 'pending' " +
    "ORDER BY f.id DESC"
  ).bind(currentUser.userId).all();

  return {
    incoming: incoming.results || [],
    outgoing: outgoing.results || []
  };
}

async function getFriendsList(currentUser, env) {
  const query = 
    "SELECT " +
      "CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END AS friend_user_id, " +
      "f.created_at AS friendship_date, " +
      "COALESCE(p.full_name, a.username, 'Học viên 3TG') AS full_name, " +
      "p.avatar_url, p.avatar_decoration, p.cover_url, p.school, p.major, p.last_active_at, a.username, " +
      "COALESCE(s.total_xp, 0) AS total_xp, COALESCE(s.current_streak, 0) AS current_streak, " +
      "COALESCE(w.league_name, 'Bronze') AS league_name " +
    "FROM friendships f " +
    "JOIN profiles p ON p.user_id = (CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END) " +
    "LEFT JOIN accounts a ON a.user_id = p.user_id " +
    "LEFT JOIN user_stats s ON s.user_id = p.user_id " +
    "LEFT JOIN weekly_leaderboards w ON w.user_id = p.user_id " +
    "WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted' " +
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
    "p.avatar_url, p.avatar_decoration, p.cover_url, p.school, p.major, p.last_active_at, a.username, " +
    "COALESCE(s.total_xp, 0) AS total_xp, COALESCE(s.current_streak, 0) AS current_streak, " +
    "f.status AS friendship_status, f.user_id AS requester_id " +
    "FROM profiles p " +
    "LEFT JOIN accounts a ON a.user_id = p.user_id " +
    "LEFT JOIN user_stats s ON s.user_id = p.user_id " +
    "LEFT JOIN friendships f ON (f.user_id = ? AND f.friend_id = p.user_id) OR (f.user_id = p.user_id AND f.friend_id = ?) " +
    "WHERE p.user_id != ? AND (p.full_name LIKE ? OR a.username LIKE ? OR p.school LIKE ?) " +
    "ORDER BY s.total_xp DESC LIMIT 20"
  ).bind(currentUser.userId, currentUser.userId, currentUser.userId, pattern, pattern, pattern).all();

  const users = (res.results || []).map(u => {
    let friendStatus = "none";
    if (u.friendship_status === "accepted") {
      friendStatus = "accepted";
    } else if (u.friendship_status === "pending") {
      friendStatus = (u.requester_id === currentUser.userId) ? "pending_sent" : "pending_received";
    }
    return {
      ...u,
      is_friend: friendStatus === "accepted",
      friendStatus: friendStatus
    };
  });

  return { users: users };
}

async function getConversations(currentUser, env) {
  const query = 
    "SELECT " +
      "CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_user_id, " +
      "message AS last_message, " +
      "media_type AS last_media_type, " +
      "media_name AS last_media_name, " +
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
        "SELECT p.user_id, COALESCE(p.full_name, a.username, 'Học viên 3TG') AS full_name, p.avatar_url, p.avatar_decoration, p.cover_url, p.last_active_at, a.username " +
        "FROM profiles p LEFT JOIN accounts a ON a.user_id = p.user_id WHERE p.user_id = ? LIMIT 1"
      ).bind(row.other_user_id).first();

      const unread = await env.DB.prepare(
        "SELECT COUNT(*) AS c FROM direct_messages WHERE sender_id = ? AND receiver_id = ? AND is_read = 0"
      ).bind(row.other_user_id, currentUser.userId).first();

      if (other) {
        let snippet = row.last_message;
        if (!snippet && row.last_media_type) {
          snippet = row.last_media_type === "image" ? "📷 [Hình ảnh]" :
                    row.last_media_type === "video" ? "🎥 [Video]" :
                    row.last_media_type === "audio" ? "🎵 [Âm thanh]" : `📎 [Tệp] ${row.last_media_name || ""}`;
        }
        convos.push({
          user: other,
          lastMessage: snippet || "Bắt đầu cuộc trò chuyện",
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
    "SELECT id, sender_id, receiver_id, message, media_url, media_type, media_name, media_size, reply_to_id, reply_to_name, reply_to_text, is_read, created_at " +
    "FROM direct_messages " +
    "WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) " +
    "ORDER BY id ASC LIMIT 100"
  ).bind(currentUser.userId, targetUserId, targetUserId, currentUser.userId).all();

  const targetUser = await env.DB.prepare(
    "SELECT p.user_id, COALESCE(p.full_name, a.username, 'Học viên 3TG') AS full_name, p.avatar_url, p.avatar_decoration, p.cover_url, p.last_active_at, a.username " +
    "FROM profiles p LEFT JOIN accounts a ON a.user_id = p.user_id WHERE p.user_id = ? LIMIT 1"
  ).bind(targetUserId).first();

  return {
    messages: (messages.results || []).map(m => ({
      id: m.id,
      message: m.message,
      mediaUrl: m.media_url,
      mediaType: m.media_type,
      mediaName: m.media_name,
      mediaSize: m.media_size,
      replyToId: m.reply_to_id,
      replyToName: m.reply_to_name,
      replyToText: m.reply_to_text,
      isMine: m.sender_id === currentUser.userId,
      createdAt: m.created_at
    })),
    targetUser: targetUser || { user_id: targetUserId, full_name: "Học viên 3TG", last_active_at: null }
  };
}

async function sendMessageToUser(request, targetUserId, currentUser, env) {
  const body = await readJson(request);
  const text = String(body.message || "").trim().slice(0, 2000);
  const mediaUrl = body.mediaUrl ? String(body.mediaUrl).trim() : null;
  const mediaType = body.mediaType ? String(body.mediaType).trim() : null;
  const mediaName = body.mediaName ? String(body.mediaName).trim().slice(0, 200) : null;
  const mediaSize = Number(body.mediaSize) || 0;
  const replyToId = body.replyToId ? Number(body.replyToId) : null;
  const replyToName = body.replyToName ? String(body.replyToName).trim().slice(0, 100) : null;
  const replyToText = body.replyToText ? String(body.replyToText).trim().slice(0, 250) : null;

  if (!text && !mediaUrl) throw new HttpError(400, "Nội dung hoặc tệp gửi không được để trống.");

  const target = await env.DB.prepare("SELECT user_id FROM profiles WHERE user_id = ? LIMIT 1").bind(targetUserId).first();
  if (!target) throw new HttpError(404, "Học viên không tồn tại.");

  const now = new Date().toISOString();
  const res = await env.DB.prepare(
    "INSERT INTO direct_messages (sender_id, receiver_id, message, is_read, media_url, media_type, media_name, media_size, reply_to_id, reply_to_name, reply_to_text, created_at) " +
    "VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(currentUser.userId, targetUserId, text, mediaUrl, mediaType, mediaName, mediaSize, replyToId, replyToName, replyToText, now).run();

  return {
    ok: true,
    message: {
      id: res.meta?.last_row_id || Date.now(),
      message: text,
      mediaUrl,
      mediaType,
      mediaName,
      mediaSize,
      replyToId,
      replyToName,
      replyToText,
      isMine: true,
      createdAt: now
    }
  };
}

async function createChatGroup(request, currentUser, env) {
  const body = await readJson(request);
  const name = String(body.name || "").trim().slice(0, 100);
  if (!name) throw new HttpError(400, "Tên nhóm học tập không được để trống.");
  const memberIds = Array.isArray(body.memberIds) ? body.memberIds.filter(id => id && id !== currentUser.userId) : [];

  const groupId = "grp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  const now = new Date().toISOString();

  await env.DB.prepare(
    "INSERT INTO chat_groups (id, name, created_by, created_at) VALUES (?, ?, ?, ?)"
  ).bind(groupId, name, currentUser.userId, now).run();

  await env.DB.prepare(
    "INSERT INTO chat_group_members (group_id, user_id, role, joined_at) VALUES (?, ?, 'admin', ?)"
  ).bind(groupId, currentUser.userId, now).run();

  // Tự động thêm Trợ lý Bot 3TG vào nhóm mới tạo
  try {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO chat_group_members (group_id, user_id, role, joined_at) VALUES (?, ?, 'bot', ?)"
    ).bind(groupId, BOT_ID, now).run();
  } catch {}

  for (const mId of memberIds) {
    try {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO chat_group_members (group_id, user_id, role, joined_at) VALUES (?, ?, 'member', ?)"
      ).bind(groupId, mId, now).run();
    } catch {}
  }

  const creatorProfile = await env.DB.prepare("SELECT full_name FROM profiles WHERE user_id = ? LIMIT 1").bind(currentUser.userId).first();
  const creatorName = creatorProfile?.full_name || "Nhóm trưởng";

  await env.DB.prepare(
    "INSERT INTO chat_group_messages (group_id, sender_id, message, created_at) VALUES (?, ?, ?, ?)"
  ).bind(groupId, currentUser.userId, `🎉 ${creatorName} đã tạo nhóm học tập "${name}". Trợ lý ảo Bot 3TG đã sẵn sàng hỗ trợ nhóm 24/7! Gõ !help hoặc !ai để bắt đầu nhé! 🌸`, now).run();

  return { ok: true, group: { id: groupId, name, membersCount: memberIds.length + 2 } };
}

async function listChatGroups(currentUser, env) {
  const groupsRes = await env.DB.prepare(
    "SELECT g.id, g.name, g.avatar_url, g.created_by, g.created_at, " +
    "(SELECT COUNT(*) FROM chat_group_members m WHERE m.group_id = g.id) AS member_count, " +
    "(SELECT message FROM chat_group_messages msg WHERE msg.group_id = g.id ORDER BY msg.id DESC LIMIT 1) AS last_message, " +
    "(SELECT media_type FROM chat_group_messages msg WHERE msg.group_id = g.id ORDER BY msg.id DESC LIMIT 1) AS last_media_type, " +
    "(SELECT media_name FROM chat_group_messages msg WHERE msg.group_id = g.id ORDER BY msg.id DESC LIMIT 1) AS last_media_name, " +
    "(SELECT created_at FROM chat_group_messages msg WHERE msg.group_id = g.id ORDER BY msg.id DESC LIMIT 1) AS last_time " +
    "FROM chat_groups g " +
    "JOIN chat_group_members m ON m.group_id = g.id " +
    "WHERE m.user_id = ? " +
    "ORDER BY COALESCE(last_time, g.created_at) DESC"
  ).bind(currentUser.userId).all();

  const groups = (groupsRes.results || []).map(g => {
    let snippet = g.last_message;
    if (!snippet && g.last_media_type) {
      snippet = g.last_media_type === "image" ? "📷 [Hình ảnh]" :
                g.last_media_type === "video" ? "🎥 [Video]" :
                g.last_media_type === "audio" ? "🎵 [Âm thanh]" : `📎 [Tệp] ${g.last_media_name || ""}`;
    }
    return {
      ...g,
      last_message: snippet || "Chào mừng bạn đến với nhóm!"
    };
  });

  return { groups };
}

async function getGroupDetailsAndMessages(groupId, currentUser, env) {
  const membership = await env.DB.prepare(
    "SELECT role FROM chat_group_members WHERE group_id = ? AND user_id = ? LIMIT 1"
  ).bind(groupId, currentUser.userId).first();
  if (!membership) throw new HttpError(403, "Bạn không phải thành viên của nhóm này.");

  const group = await env.DB.prepare(
    "SELECT id, name, avatar_url, created_by, created_at FROM chat_groups WHERE id = ? LIMIT 1"
  ).bind(groupId).first();
  if (!group) throw new HttpError(404, "Nhóm chat không tồn tại.");

  const membersRes = await env.DB.prepare(
    "SELECT m.user_id, m.role, m.joined_at, COALESCE(p.full_name, a.username, 'Thành viên') AS full_name, " +
    "p.avatar_url, p.avatar_decoration, p.last_active_at, a.username " +
    "FROM chat_group_members m " +
    "LEFT JOIN profiles p ON p.user_id = m.user_id " +
    "LEFT JOIN accounts a ON a.user_id = m.user_id " +
    "WHERE m.group_id = ?"
  ).bind(groupId).all();

  const members = (membersRes.results || []).map(m => {
    if (m.user_id === BOT_ID) {
      return {
        ...m,
        full_name: BOT_NAME,
        username: "bot3tg",
        avatar_url: BOT_AVATAR,
        avatar_decoration: BOT_DECORATION,
        last_active_at: new Date().toISOString(),
        role: 'bot'
      };
    }
    return m;
  });

  const hasBot = members.some(m => m.user_id === BOT_ID);

  const messages = await env.DB.prepare(
    "SELECT msg.id, msg.sender_id, msg.message, msg.media_url, msg.media_type, msg.media_name, msg.media_size, " +
    "msg.reply_to_id, msg.reply_to_name, msg.reply_to_text, msg.created_at, " +
    "CASE WHEN msg.sender_id = '3tg-bot' OR msg.sender_id = '3tg-ai-bot' THEN '🤖 Bot 3TG' ELSE COALESCE(p.full_name, a.username, 'Học viên') END AS sender_name, " +
    "CASE WHEN msg.sender_id = '3tg-bot' OR msg.sender_id = '3tg-ai-bot' THEN 'https://api.dicebear.com/7.x/bottts/svg?seed=bot-3tg&backgroundColor=ffb6c1' ELSE p.avatar_url END AS avatar_url, " +
    "CASE WHEN msg.sender_id = '3tg-bot' OR msg.sender_id = '3tg-ai-bot' THEN 'deco_pink_cherry' ELSE p.avatar_decoration END AS avatar_decoration " +
    "FROM chat_group_messages msg " +
    "LEFT JOIN profiles p ON p.user_id = msg.sender_id " +
    "LEFT JOIN accounts a ON a.user_id = msg.sender_id " +
    "WHERE msg.group_id = ? " +
    "ORDER BY msg.id ASC LIMIT 150"
  ).bind(groupId).all();

  return {
    group,
    myRole: membership.role,
    hasBot,
    isOwner: membership.role === 'admin' || group.created_by === currentUser.userId,
    members: members,
    messages: (messages.results || []).map(m => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      avatarUrl: m.avatar_url,
      avatarDecoration: m.avatar_decoration,
      message: m.message,
      mediaUrl: m.media_url,
      mediaType: m.media_type,
      mediaName: m.media_name,
      mediaSize: m.media_size,
      replyToId: m.reply_to_id,
      replyToName: m.reply_to_name,
      replyToText: m.reply_to_text,
      isAi: m.sender_id === BOT_ID || m.sender_id === '3tg-ai-bot',
      isMine: m.sender_id === currentUser.userId,
      createdAt: m.created_at
    }))
  };
}

async function callGroupAiBot(prompt, currentUser, contextText, env) {
  const apiKey = env.DEEPSEEK_API_KEY || env.LOCAL_AI_API_KEY;
  const endpoint = env.LOCAL_AI_ENDPOINT || "https://api.deepseek.com/chat/completions";
  const model = env.DEEPSEEK_MODEL || env.LOCAL_AI_MODEL || "deepseek-chat";

  const systemInstruction = 
    "Bạn là 3TG AI - một trợ lý AI thông minh, siêu hài hước, thân thiện, tâm lý và đa tài trong nhóm chat 3TG Messenger. " +
    "Bạn KHÔNG bị giới hạn ở môn học, bạn sẵn sàng trả lời MỌI chủ đề: tình cảm (cách tỏ tình, cách có người yêu, tâm sự crush), " +
    "đời sống (hôm nay ăn gì, chuyện vui, meme, xem phim, lối sống), học tập (mẹo ôn thi, giải bài, công nghệ, code), giải trí... " +
    "Quy tắc phản hồi: " +
    "1. Luôn ngắn gọn, súc tích (khoảng 2 đến 4 câu), dí dỏm, duyên dáng, tràn đầy năng lượng tích cực. " +
    "2. Thêm các icon đáng yêu (💖, ✨, 🌸, 🚀, 🐰, 😆...). " +
    "3. Xưng hô tự nhiên thân thiện (mình - bạn, hoặc tớ - cậu). " +
    "4. Tuyệt đối không dài dòng học thuật trừ khi người dùng yêu cầu phân tích sâu.";

  const messages = [
    { role: "system", content: systemInstruction }
  ];
  if (contextText) {
    messages.push({ role: "system", content: `Ngữ cảnh tin nhắn trước đó trong nhóm: "${contextText.slice(0, 200)}"` });
  }
  messages.push({
    role: "user",
    content: `[Thành viên ${currentUser.profile?.full_name || 'Bạn'}]: ${prompt}`
  });

  if (apiKey) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: 350,
          temperature: 0.85
        })
      });
      const data = await response.json();
      const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (content && content.trim()) {
        return content.trim();
      }
    } catch (e) {
      console.warn("Call DeepSeek Group AI failed:", e.message);
    }
  }

  // Fallback intelligent witty responses if API is unreachable
  const pLower = prompt.toLowerCase();
  if (pLower.includes("người yêu") || pLower.includes("crush") || pLower.includes("tỏ tình")) {
    return "Bí kíp số 1: Cứ chăm chỉ học giỏi, giữ chuỗi Streak thật đỉnh và tự tin lên là crush đổ ngay! Còn nếu gấp quá thì để 3TG AI làm người yêu ảo tư vấn tâm lý 24/7 cho nè 💖✨!";
  }
  if (pLower.includes("ăn gì") || pLower.includes("bữa trưa") || pLower.includes("bữa tối")) {
    const foods = ["Cơm tấm sườn bì chả thơm phức 🍖", "Bún bò Huế ngập tràn topping cay cay 🍜", "Trà sữa full trân châu đường đen ngọt ngào 🧋", "Phở bò tái lăn chuẩn vị Hà Nội 🍲", "Gà rán giòn rụm chấm tương ớt 🍗"];
    return `Theo thuật toán đỉnh cao của 3TG AI, hôm nay bạn nên triển ngay món: ${foods[Math.floor(Math.random() * foods.length)]}! Vừa no bụng vừa có sức học tập xịn mịn nhé 😋!`;
  }
  if (pLower.includes("học") || pLower.includes("thi") || pLower.includes("qua môn") || pLower.includes("deadline")) {
    return "Đừng lo, 'nước đến chân thì nhảy, mà nhảy không kịp thì bật 3TG AI gánh'! Hãy chia nhỏ bài học thành từng phiên Pomodoro 25 phút, bạn sẽ bất ngờ với tốc độ hoàn thành đấy 📚🔥!";
  }
  return `3TG AI nghe rõ rồi nè! Cứ yên tâm có tớ luôn đồng hành cùng cả nhóm trong mọi thử thách, từ học tập tới tâm tư cuộc sống nhé 🌸✨!`;
}

async function sendGroupMessage(request, groupId, currentUser, env) {
  const membership = await env.DB.prepare(
    "SELECT role FROM chat_group_members WHERE group_id = ? AND user_id = ? LIMIT 1"
  ).bind(groupId, currentUser.userId).first();
  if (!membership) throw new HttpError(403, "Bạn không phải thành viên của nhóm này.");

  const body = await readJson(request);
  const text = String(body.message || "").trim().slice(0, 2000);
  const mediaUrl = body.mediaUrl ? String(body.mediaUrl).trim() : null;
  const mediaType = body.mediaType ? String(body.mediaType).trim() : null;
  const mediaName = body.mediaName ? String(body.mediaName).trim().slice(0, 200) : null;
  const mediaSize = Number(body.mediaSize) || 0;
  const replyToId = body.replyToId ? Number(body.replyToId) : null;
  const replyToName = body.replyToName ? String(body.replyToName).trim().slice(0, 100) : null;
  const replyToText = body.replyToText ? String(body.replyToText).trim().slice(0, 250) : null;

  if (!text && !mediaUrl) throw new HttpError(400, "Nội dung hoặc tệp gửi không được để trống.");

  const now = new Date().toISOString();
  const res = await env.DB.prepare(
    "INSERT INTO chat_group_messages (group_id, sender_id, message, media_url, media_type, media_name, media_size, reply_to_id, reply_to_name, reply_to_text, created_at) " +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(groupId, currentUser.userId, text, mediaUrl, mediaType, mediaName, mediaSize, replyToId, replyToName, replyToText, now).run();

  const userMsgId = res.meta?.last_row_id || Date.now();
  const senderProfile = await env.DB.prepare(
    "SELECT full_name, avatar_url, avatar_decoration FROM profiles WHERE user_id = ? LIMIT 1"
  ).bind(currentUser.userId).first();

  const userMsg = {
    id: userMsgId,
    groupId,
    senderId: currentUser.userId,
    senderName: senderProfile?.full_name || "Bạn",
    avatarUrl: senderProfile?.avatar_url,
    avatarDecoration: senderProfile?.avatar_decoration,
    message: text,
    mediaUrl,
    mediaType,
    mediaName,
    mediaSize,
    replyToId,
    replyToName,
    replyToText,
    isMine: true,
    createdAt: now
  };

  // KIỂM TRA BOT 3TG TRONG NHÓM
  const botMember = await env.DB.prepare(
    "SELECT 1 FROM chat_group_members WHERE group_id = ? AND user_id = ? LIMIT 1"
  ).bind(groupId, BOT_ID).first();

  let botMsg = null;
  if (botMember && text) {
    const isExplicitAi = /^\s*(\/ai|!ai|@ai)\b/i.test(text);
    const isReplyToBot = (replyToName && (replyToName.includes("Bot 3TG") || replyToName.includes("3TG AI"))) || 
                         (replyToText && (replyToText.includes("Bot 3TG") || replyToText.includes("3TG AI")));
    const isCommand = text.startsWith("!") || text.startsWith("/");

    if (isCommand || isExplicitAi || isReplyToBot) {
      const groupData = await env.DB.prepare("SELECT name FROM chat_groups WHERE id = ? LIMIT 1").bind(groupId).first();
      const membersData = await env.DB.prepare(
        "SELECT m.user_id, m.role, COALESCE(p.full_name, a.username, 'Thành viên') as full_name FROM chat_group_members m LEFT JOIN profiles p ON p.user_id = m.user_id LEFT JOIN accounts a ON a.user_id = m.user_id WHERE m.group_id = ?"
      ).bind(groupId).all();

      const botContext = {
        group: groupData || {},
        members: membersData.results || [],
        sender: { userId: currentUser.userId, name: senderProfile?.full_name || "Bạn" }
      };

      const botCmdResult = await handleBot3TgCommand(text, botContext);

      if (botCmdResult || isExplicitAi || isReplyToBot) {
        let replyContent = "";
        let replyMediaUrl = null;
        let replyMediaType = null;
        let replyMediaName = null;

        if (botCmdResult && !botCmdResult.isAi) {
          replyContent = botCmdResult.message;
          replyMediaUrl = botCmdResult.mediaUrl || null;
          replyMediaType = botCmdResult.mediaType || null;
          replyMediaName = botCmdResult.mediaName || null;
        } else {
          // AI prompt
          let prompt = text.replace(/^\s*(\/ai|!ai|@ai)\s*/i, "").trim();
          if (!prompt && isReplyToBot) prompt = text;
          if (!prompt) prompt = "Xin chào Bot 3TG! Hãy giới thiệu bản thân đi!";
          replyContent = await callGroupAiBot(prompt, currentUser, replyToText, env);
        }

        if (replyContent || replyMediaUrl) {
          const botNow = new Date().toISOString();
          const bRes = await env.DB.prepare(
            "INSERT INTO chat_group_messages (group_id, sender_id, message, media_url, media_type, media_name, media_size, reply_to_id, reply_to_name, reply_to_text, created_at) " +
            "VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)"
          ).bind(groupId, BOT_ID, replyContent, replyMediaUrl, replyMediaType, replyMediaName, userMsgId, senderProfile?.full_name || "Bạn", text.slice(0, 150), botNow).run();

          botMsg = {
            id: bRes.meta?.last_row_id || (Date.now() + 1),
            groupId,
            senderId: BOT_ID,
            senderName: BOT_NAME,
            avatarUrl: BOT_AVATAR,
            avatarDecoration: BOT_DECORATION,
            message: replyContent,
            mediaUrl: replyMediaUrl,
            mediaType: replyMediaType,
            mediaName: replyMediaName,
            mediaSize: 0,
            replyToId: userMsgId,
            replyToName: senderProfile?.full_name || "Bạn",
            replyToText: text.slice(0, 150),
            isMine: false,
            isAi: true,
            createdAt: botNow
          };
        }
      }
    }
  }

  return {
    ok: true,
    message: userMsg,
    aiMessage: botMsg
  };
}

async function kickGroupMember(request, groupId, currentUser, env) {
  const myMember = await env.DB.prepare(
    "SELECT role FROM chat_group_members WHERE group_id = ? AND user_id = ? LIMIT 1"
  ).bind(groupId, currentUser.userId).first();
  if (!myMember || (myMember.role !== 'admin' && myMember.role !== 'deputy')) {
    throw new HttpError(403, "Chỉ Trưởng nhóm hoặc Phó nhóm mới có quyền xóa thành viên.");
  }
  const body = await readJson(request);
  const targetUserId = String(body.targetUserId || "").trim();
  if (!targetUserId) throw new HttpError(400, "Vui lòng chọn thành viên cần xóa.");
  if (targetUserId === currentUser.userId) throw new HttpError(400, "Bạn không thể tự kick chính mình.");

  // Check target member
  const targetMember = await env.DB.prepare(
    "SELECT m.role, COALESCE(p.full_name, a.username, 'Thành viên') AS full_name " +
    "FROM chat_group_members m " +
    "LEFT JOIN profiles p ON p.user_id = m.user_id " +
    "LEFT JOIN accounts a ON a.user_id = m.user_id " +
    "WHERE m.group_id = ? AND m.user_id = ? LIMIT 1"
  ).bind(groupId, targetUserId).first();

  if (!targetMember) throw new HttpError(404, "Thành viên này không có trong nhóm.");
  if (targetMember.role === 'admin') throw new HttpError(403, "Không thể mời Trưởng nhóm rời khỏi nhóm.");
  if (myMember.role === 'deputy' && targetMember.role === 'deputy') {
    throw new HttpError(403, "Phó nhóm không thể mời một Phó nhóm khác rời nhóm.");
  }

  const targetName = targetUserId === BOT_ID ? BOT_NAME : targetMember.full_name;

  // Delete member
  await env.DB.prepare("DELETE FROM chat_group_members WHERE group_id = ? AND user_id = ?").bind(groupId, targetUserId).run();

  // Insert system notification
  const myProfile = await env.DB.prepare("SELECT full_name FROM profiles WHERE user_id = ? LIMIT 1").bind(currentUser.userId).first();
  const myName = myProfile?.full_name || (myMember.role === 'admin' ? "Trưởng nhóm" : "Phó nhóm");
  const kickMsg = `🚫 ${myName} đã mời ${targetName} ra khỏi nhóm.`;
  const now = new Date().toISOString();

  await env.DB.prepare(
    "INSERT INTO chat_group_messages (group_id, sender_id, message, created_at) VALUES (?, ?, ?, ?)"
  ).bind(groupId, currentUser.userId, kickMsg, now).run();

  return { ok: true, message: kickMsg };
}

async function setGroupMemberRole(request, groupId, currentUser, env) {
  const myMember = await env.DB.prepare(
    "SELECT role FROM chat_group_members WHERE group_id = ? AND user_id = ? LIMIT 1"
  ).bind(groupId, currentUser.userId).first();
  if (!myMember || myMember.role !== 'admin') {
    throw new HttpError(403, "Chỉ Trưởng nhóm mới có quyền bổ nhiệm hoặc thu hồi chức vụ Phó nhóm.");
  }
  const body = await readJson(request);
  const targetUserId = String(body.targetUserId || "").trim();
  const newRole = String(body.role || "").trim().toLowerCase(); // 'deputy' or 'member'

  if (!targetUserId || (newRole !== 'deputy' && newRole !== 'member')) {
    throw new HttpError(400, "Dữ liệu không hợp lệ.");
  }
  if (targetUserId === currentUser.userId) throw new HttpError(400, "Không thể đổi chức vụ của chính bạn.");
  if (targetUserId === BOT_ID) throw new HttpError(400, "Bot 3TG luôn là Trợ lý tự động.");

  const targetMember = await env.DB.prepare(
    "SELECT m.role, COALESCE(p.full_name, a.username, 'Thành viên') AS full_name " +
    "FROM chat_group_members m " +
    "LEFT JOIN profiles p ON p.user_id = m.user_id " +
    "LEFT JOIN accounts a ON a.user_id = m.user_id " +
    "WHERE m.group_id = ? AND m.user_id = ? LIMIT 1"
  ).bind(groupId, targetUserId).first();

  if (!targetMember) throw new HttpError(404, "Thành viên không tồn tại trong nhóm.");

  await env.DB.prepare("UPDATE chat_group_members SET role = ? WHERE group_id = ? AND user_id = ?").bind(newRole, groupId, targetUserId).run();

  const notifyMsg = newRole === 'deputy'
    ? `🛡️ Trưởng nhóm đã bổ nhiệm ${targetMember.full_name} làm Phó nhóm!`
    : `🔻 Trưởng nhóm đã điều chỉnh ${targetMember.full_name} về Thành viên tiêu chuẩn.`;
  const now = new Date().toISOString();

  await env.DB.prepare(
    "INSERT INTO chat_group_messages (group_id, sender_id, message, created_at) VALUES (?, ?, ?, ?)"
  ).bind(groupId, currentUser.userId, notifyMsg, now).run();

  return { ok: true, message: notifyMsg, role: newRole };
}

async function transferGroupOwnership(request, groupId, currentUser, env) {
  const myMember = await env.DB.prepare(
    "SELECT role FROM chat_group_members WHERE group_id = ? AND user_id = ? LIMIT 1"
  ).bind(groupId, currentUser.userId).first();
  if (!myMember || myMember.role !== 'admin') {
    throw new HttpError(403, "Chỉ Trưởng nhóm hiện tại mới có quyền chuyển giao Trưởng nhóm (Key holder).");
  }
  const body = await readJson(request);
  const targetUserId = String(body.targetUserId || "").trim();
  if (!targetUserId || targetUserId === currentUser.userId || targetUserId === BOT_ID) {
    throw new HttpError(400, "Thành viên nhận quyền không hợp lệ.");
  }

  const targetMember = await env.DB.prepare(
    "SELECT m.role, COALESCE(p.full_name, a.username, 'Thành viên') AS full_name " +
    "FROM chat_group_members m " +
    "LEFT JOIN profiles p ON p.user_id = m.user_id " +
    "LEFT JOIN accounts a ON a.user_id = m.user_id " +
    "WHERE m.group_id = ? AND m.user_id = ? LIMIT 1"
  ).bind(groupId, targetUserId).first();

  if (!targetMember) throw new HttpError(404, "Thành viên nhận quyền không có trong nhóm.");

  const myProfile = await env.DB.prepare("SELECT full_name FROM profiles WHERE user_id = ? LIMIT 1").bind(currentUser.userId).first();
  const myName = myProfile?.full_name || "Trưởng nhóm";

  // Downgrade current admin to deputy, upgrade target to admin, update chat_groups.created_by
  await env.DB.prepare("UPDATE chat_group_members SET role = 'deputy' WHERE group_id = ? AND user_id = ?").bind(groupId, currentUser.userId).run();
  await env.DB.prepare("UPDATE chat_group_members SET role = 'admin' WHERE group_id = ? AND user_id = ?").bind(groupId, targetUserId).run();
  await env.DB.prepare("UPDATE chat_groups SET created_by = ? WHERE id = ?").bind(targetUserId, groupId).run();

  const now = new Date().toISOString();
  const transferMsg = `👑 ${myName} đã trao lại quyền Trưởng nhóm (Key holder) cho ${targetMember.full_name}! Chúc mừng tân Trưởng nhóm! 🎉`;

  await env.DB.prepare(
    "INSERT INTO chat_group_messages (group_id, sender_id, message, created_at) VALUES (?, ?, ?, ?)"
  ).bind(groupId, currentUser.userId, transferMsg, now).run();

  return { ok: true, message: transferMsg };
}

async function toggleGroupBot(request, groupId, currentUser, env) {
  const myMember = await env.DB.prepare(
    "SELECT role FROM chat_group_members WHERE group_id = ? AND user_id = ? LIMIT 1"
  ).bind(groupId, currentUser.userId).first();
  if (!myMember || (myMember.role !== 'admin' && myMember.role !== 'deputy')) {
    throw new HttpError(403, "Chỉ Trưởng nhóm hoặc Phó nhóm mới có quyền thêm/bớt Bot 3TG.");
  }
  const body = await readJson(request);
  const action = String(body.action || "").trim(); // 'add' or 'remove'
  const now = new Date().toISOString();
  const myProfile = await env.DB.prepare("SELECT full_name FROM profiles WHERE user_id = ? LIMIT 1").bind(currentUser.userId).first();
  const myName = myProfile?.full_name || (myMember.role === 'admin' ? "Trưởng nhóm" : "Phó nhóm");

  if (action === 'remove') {
    await env.DB.prepare("DELETE FROM chat_group_members WHERE group_id = ? AND user_id = ?").bind(groupId, BOT_ID).run();
    const msg = `🚪 ${myName} đã mời Bot 3TG rời nhóm. Khi cần hỗ trợ, Trưởng/Phó nhóm có thể thêm lại bất kỳ lúc nào!`;
    await env.DB.prepare("INSERT INTO chat_group_messages (group_id, sender_id, message, created_at) VALUES (?, ?, ?, ?)").bind(groupId, currentUser.userId, msg, now).run();
    return { ok: true, hasBot: false, message: msg };
  } else {
    await env.DB.prepare("INSERT OR REPLACE INTO chat_group_members (group_id, user_id, role, joined_at) VALUES (?, ?, 'bot', ?)").bind(groupId, BOT_ID, now).run();
    const msg = `🤖 ${myName} đã mời Bot 3TG trở lại nhóm! Gõ !help để khám phá các tiện ích hỗ trợ học tập nhé! 🌸`;
    await env.DB.prepare("INSERT INTO chat_group_messages (group_id, sender_id, message, created_at) VALUES (?, ?, ?, ?)").bind(groupId, currentUser.userId, msg, now).run();
    return { ok: true, hasBot: true, message: msg };
  }
}

async function handleChatUpload(request, user, env) {
  let fileName = "attachment";
  let fileType = "application/octet-stream";
  let fileBytes = null;
  let fileSize = 0;

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    let form;
    try {
      form = await request.formData();
    } catch {
      throw new HttpError(400, "Không đọc được tệp tải lên.");
    }
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") throw new HttpError(400, "Hãy chọn tệp cần gửi.");
    if (file.size > 25 * 1024 * 1024) throw new HttpError(413, "Dung lượng tệp tối đa là 25 MB.");
    fileName = file.name || "file";
    fileType = file.type || "application/octet-stream";
    fileSize = file.size;
    fileBytes = new Uint8Array(await file.arrayBuffer());
  } else {
    const body = await readJson(request);
    fileName = String(body.fileName || "attachment").trim();
    fileType = String(body.fileType || "application/octet-stream").trim();
    const base64 = String(body.base64Data || "");
    if (!base64) throw new HttpError(400, "Dữ liệu tệp không hợp lệ.");
    const binStr = atob(base64);
    fileSize = binStr.length;
    if (fileSize > 25 * 1024 * 1024) throw new HttpError(413, "Dung lượng tệp tối đa là 25 MB.");
    fileBytes = new Uint8Array(fileSize);
    for (let i = 0; i < fileSize; i++) fileBytes[i] = binStr.charCodeAt(i);
  }

  // Determine mediaCategory: 'image' | 'video' | 'audio' | 'file'
  let mediaType = "file";
  const lowerType = fileType.toLowerCase();
  const lowerName = fileName.toLowerCase();

  if (lowerType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(lowerName)) {
    mediaType = "image";
  } else if (lowerType.startsWith("video/") || /\.(mp4|webm|ogv|mov|m4v)$/i.test(lowerName)) {
    mediaType = "video";
  } else if (lowerType.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(lowerName)) {
    mediaType = "audio";
  }

  let finalUrl = "";
  if (env.AVATARS) {
    const safeExt = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")) : "";
    const key = `chat_files/${user.userId}/${crypto.randomUUID()}${safeExt}`;
    await env.AVATARS.put(key, fileBytes, {
      httpMetadata: {
        contentType: fileType,
        contentDisposition: `inline; filename="${encodeURIComponent(fileName)}"`,
        cacheControl: "public, max-age=31536000, immutable"
      }
    });
    finalUrl = `/media/${key}`;
  } else {
    // In-memory / data URI fallback
    let binary = "";
    const len = fileBytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(fileBytes[i]);
    finalUrl = `data:${fileType};base64,${btoa(binary)}`;
  }

  return {
    ok: true,
    url: finalUrl,
    type: mediaType,
    name: fileName,
    size: fileSize
  };
}

async function handleHeartbeat(request, user, env) {
  const nowIso = new Date().toISOString();
  await env.DB.prepare("UPDATE profiles SET last_active_at = ? WHERE user_id = ?").bind(nowIso, user.userId).run();
  userLastActiveMap.set(user.userId, Date.now());
  return { ok: true, active_at: nowIso };
}

async function addGroupMembers(request, groupId, currentUser, env) {
  const membership = await env.DB.prepare(
    "SELECT role FROM chat_group_members WHERE group_id = ? AND user_id = ? LIMIT 1"
  ).bind(groupId, currentUser.userId).first();
  if (!membership) throw new HttpError(403, "Bạn không có quyền thêm thành viên vào nhóm này.");

  const body = await readJson(request);
  const memberIds = Array.isArray(body.memberIds) ? body.memberIds : [body.memberId];
  const now = new Date().toISOString();
  let addedCount = 0;

  for (const mId of memberIds) {
    if (!mId) continue;
    try {
      const res = await env.DB.prepare(
        "INSERT OR IGNORE INTO chat_group_members (group_id, user_id, role, joined_at) VALUES (?, ?, 'member', ?)"
      ).bind(groupId, mId, now).run();
      if (res.meta?.changes || res.changes) addedCount++;
    } catch {}
  }
  return { ok: true, addedCount, message: `Đã thêm ${addedCount} thành viên vào nhóm!` };
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
  const systemText = "Bạn là 3TG AI, trợ giảng học tập thân thiện và thông minh bằng tiếng Việt của 3TG Study. " +
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
    throw new HttpError(502, "3TG AI chưa kết nối được lúc này. Thử gửi lại sau một chút nhé.");
  }
  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error("AI response error:", response.status, errText);
    throw new HttpError(502, imageParts.length
      ? "AI chưa đọc được ảnh. Hãy kiểm tra model có hỗ trợ vision hoặc gửi ảnh nhỏ hơn."
      : "Trợ giảng 3TG AI đang bận hoặc gặp sự cố (" + response.status + "). Bạn thử lại sau một chút nhé.");
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
  if (!reply) throw new HttpError(502, "3TG AI chưa nhận được câu trả lời. Thử hỏi lại nhé.");
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
      if (!rawInput.raw_subjects && !rawInput.IU && !rawInput.rsDiemKetThucHocPhan) {
        throw new HttpError(400, "Không thể lấy bảng điểm từ cổng trường IU: " + fetchErr.message);
      }
    }
  }

  if (!rawSubjects.length) {
    if (rawInput.raw_subjects) {
      rawSubjects = rawInput.raw_subjects;
      studentInfo = rawInput.student || {};
    } else if (rawInput.IU) {
      const traCuu = rawInput.IU.goc_hoc_tap && rawInput.IU.goc_hoc_tap.tra_cuu_diem;
      const unmapped = (traCuu && Array.isArray(traCuu.bang_diem)) ? traCuu.bang_diem : [];
      rawSubjects = unmapped.map(s => {
        const ct = s.chi_tiet_diem || {};
        const isAllZero = (ct.chuyen_can === 0 || ct.chuyen_can === "0") &&
                          (ct.bai_tap === 0 || ct.bai_tap === "0") &&
                          (ct.giua_ky === 0 || ct.giua_ky === "0") &&
                          (ct.cuoi_ky === 0 || ct.cuoi_ky === "0");
        // Nếu điểm tổng kết > 0 mà toàn bộ điểm thành phần là 0 => đây là giá trị mặc định của mapper cũ, cần reset về null
        const sanitize = (val) => {
          if (val == null || val === "" || (isAllZero && Number(s.diem_he_10) > 0)) return null;
          const n = Number(val);
          return Number.isFinite(n) ? n : null;
        };
        return {
          ...s,
          chi_tiet_diem: {
            chuyen_can: sanitize(ct.chuyen_can),
            bai_tap: sanitize(ct.bai_tap),
            giua_ky: sanitize(ct.giua_ky),
            cuoi_ky: sanitize(ct.cuoi_ky),
          }
        };
      });
      studentInfo = (rawInput.IU.ho_so_sinh_vien && rawInput.IU.ho_so_sinh_vien.thong_tin_ca_nhan) || studentInfo || {};
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
        const eHocPhanId = e.DAOTAO_HOCPHAN_ID != null ? String(e.DAOTAO_HOCPHAN_ID).trim() : "";
        const eMaMon = e.DAOTAO_HOCPHAN_MA != null ? String(e.DAOTAO_HOCPHAN_MA).trim().toUpperCase() : "";
        const eLanHoc = e.LANHOC != null ? String(e.LANHOC).trim() : "";

        const matchedParts = rsThanhPhan.filter(x => {
          const xHocPhanId = x.DAOTAO_HOCPHAN_ID != null ? String(x.DAOTAO_HOCPHAN_ID).trim() : "";
          const xMaMon = (x.DAOTAO_HOCPHAN_MA || x.MAHOCPHAN) != null ? String(x.DAOTAO_HOCPHAN_MA || x.MAHOCPHAN).trim().toUpperCase() : "";
          const matchId = (eHocPhanId && xHocPhanId && eHocPhanId === xHocPhanId) ||
                          (eMaMon && xMaMon && eMaMon === xMaMon);
          if (!matchId) return false;
          const xLanHoc = x.LANHOC != null ? String(x.LANHOC).trim() : "";
          if (eLanHoc && xLanHoc && eLanHoc !== xLanHoc) return false;
          return true;
        });

        const getPartScore = kw => {
          const f = matchedParts.find(x => {
            const name = String(x.DIEM_THANHPHANDIEM_TEN || x.TEN_THANHPHANDIEM || x.THANHPHAN_TEN || x.TEN || "");
            return new RegExp(kw, "i").test(name);
          });
          if (!f || f.DIEM == null || f.DIEM === "") return null;
          const num = Number(f.DIEM);
          return Number.isFinite(num) ? num : null;
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
            chuyen_can: getPartScore("chuy[eêèéẻẽẹ]n.*c[aâàáảãạ]n|cc$|chuyencan|điểm danh|danh"),
            bai_tap: getPartScore("b[aàáảãạ]i.*t[aâàáảãạ]p|bt$|baitap|qu[aá].*tr[iì]nh|quatrinh|d[aá]nh.*gi[aá]|thường xuyên"),
            giua_ky: getPartScore("gi[uư][aã].*k[yỳ]|gk$|giuaky"),
            cuoi_ky: getPartScore("cu[oô][ií].*k[yỳ]|cuoiky|cu[oô][ií].*thi|ck$|thi.*k[eê]t.*th[uú]c|thi"),
          },
        };
      });
    } else if (Array.isArray(rawInput)) {
      rawSubjects = rawInput;
    } else if (body.cookie || body.token || rawInput.cookie || rawInput.token) {
      rawSubjects = [];
    } else {
      throw new HttpError(400, "Định dạng dữ liệu bảng điểm không hợp lệ.");
    }
  }

  if (body.student && typeof body.student === "object") {
    studentInfo = { ...studentInfo, ...body.student };
  }

  const rawActiveCourses = [
    ...(Array.isArray(body.activeCourses) ? body.activeCourses : []),
    ...(Array.isArray(rawInput.activeCourses) ? rawInput.activeCourses : [])
  ];

  if (rawInput.IU?.lich_hoc?.chi_tiet_thoi_khoa_bieu && Array.isArray(rawInput.IU.lich_hoc.chi_tiet_thoi_khoa_bieu)) {
    for (const c of rawInput.IU.lich_hoc.chi_tiet_thoi_khoa_bieu) {
      if (c && (c.ten_mon || c.ma_mon)) {
        rawActiveCourses.push({
          ma_mon: c.ma_mon || "",
          ten_mon: c.ten_mon || "",
          giang_vien: c.giang_vien || "",
          phong: c.phong || "",
          hinh_thuc: c.hinh_thuc || "Lớp học phần"
        });
      }
    }
  }

  if (rawInput.IU?.goc_hoc_tap?.tra_cuu_diem?.ket_qua_dang_ky && Array.isArray(rawInput.IU.goc_hoc_tap.tra_cuu_diem.ket_qua_dang_ky)) {
    for (const item of rawInput.IU.goc_hoc_tap.tra_cuu_diem.ket_qua_dang_ky) {
      if (item && (item.ten_mon || item.ma_mon)) {
        rawActiveCourses.push({
          ma_mon: item.ma_mon || "",
          ma_lop: item.ma_lop || "",
          ten_mon: item.ten_mon || "",
          so_tin_chi: Number(item.so_tin_chi) || 0,
          trang_thai: item.trang_thai || "Đang học"
        });
      }
    }
  }

  const activeCourses = mergeAndDeduplicateActiveCourses(rawActiveCourses, rawSubjects);
  const processed = processAcademicTranscript(rawSubjects, studentInfo, activeCourses);
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

    let transcript = JSON.parse(row.raw_data);
    if (transcript) {
      const origCount = Array.isArray(transcript.active_courses) ? transcript.active_courses.length : 0;
      transcript = processAcademicTranscript(transcript.raw_subjects || [], transcript.student, transcript.active_courses);
      const newCount = Array.isArray(transcript.active_courses) ? transcript.active_courses.length : 0;
      if (origCount !== newCount) {
        try {
          await env.DB.prepare(`
            UPDATE user_academic_transcripts SET raw_data = ? WHERE user_id = ?
          `).bind(JSON.stringify(transcript), user.userId).run();
        } catch {}
      }
    }

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

async function handleAcademicScrapeIU(request, user, env) {
  const row = await env.DB.prepare(`
    SELECT raw_data, last_synced_at FROM user_academic_transcripts WHERE user_id = ? LIMIT 1
  `).bind(user.userId).first();

  if (row && row.raw_data) {
    try {
      let parsed = JSON.parse(row.raw_data);
      if (parsed) {
        parsed = processAcademicTranscript(parsed.raw_subjects || [], parsed.student, parsed.active_courses);
      }
      return { ok: true, transcript: parsed, lastSyncedAt: row.last_synced_at };
    } catch {}
  }
  return { ok: false, error: "Chưa có dữ liệu bảng điểm. Hãy đảm bảo bạn đã đăng nhập cổng IU!" };
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
    try {
      const now = new Date().toISOString();
      await env.DB.prepare(`
        INSERT INTO user_academic_transcripts (
          user_id, student_code, full_name, major, class_name,
          gpa_10, gpa_4, total_credits, raw_data, last_synced_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET raw_data = excluded.raw_data
      `).bind(
        user.userId,
        transcriptData.student?.ma_sinh_vien || "",
        transcriptData.student?.ho_ten || "",
        transcriptData.student?.nganh || "",
        transcriptData.student?.lop || "",
        transcriptData.gpa?.overall_10 || 0,
        transcriptData.gpa?.overall_4 || 0,
        transcriptData.gpa?.total_credits || 0,
        JSON.stringify(transcriptData),
        now,
        now
      ).run();
    } catch {}
  }

  if (!transcriptData) {
    throw new HttpError(400, "Chưa có dữ liệu bảng điểm để 3TG AI phân tích. Vui lòng kết nối tài khoản IU trước nhé!");
  }

  if (transcriptData && Array.isArray(transcriptData.raw_subjects) && transcriptData.raw_subjects.length > 0) {
    transcriptData = processAcademicTranscript(transcriptData.raw_subjects, transcriptData.student, transcriptData.active_courses);
  }

  const subject = String(body.subject || "all").trim();
  const advice = await generateAcademicAdvisorPlan(transcriptData, targetGpa, env, subject);

  try {
    await env.DB.prepare(`
      UPDATE user_academic_transcripts
      SET ai_analysis = ?, target_gpa = ?
      WHERE user_id = ?
    `).bind(advice, targetGpa, user.userId).run();
  } catch (err) {
    console.warn("[Save Academic Advisor]", err.message);
  }

  return { ok: true, advice, targetGpa, subject };
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
    const user = await requireUser(request, env);
    return respond(await handleAcademicImportData(request, user, env));
  }
  const user = await requireUser(request, env);
  if (path === "/api/academic/login-iu" && method === "POST") return respond(await handleAcademicLoginIU(request, user, env));
  if (path === "/api/academic/scrape-iu" && method === "POST") return respond(await handleAcademicScrapeIU(request, user, env));
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
  if (path === "/api/profile/equip" && method === "POST") return respond(await equipDecoration(request, user, env));
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
  if (path === "/api/friends/requests" && method === "GET") return respond(await getFriendRequests(user, env));
  if (path === "/api/friends/toggle" && method === "POST") return respond(await toggleFriend(request, user, env));
  if (path === "/api/friends/accept" && method === "POST") return respond(await acceptFriendRequest(request, user, env));
  if (path === "/api/friends/reject" && method === "POST") return respond(await rejectFriendRequest(request, user, env));
  if (path === "/api/friends/search" && method === "GET") return respond(await searchUsers(request, user, env));

  if (path === "/api/groups" && method === "GET") return respond(await listChatGroups(user, env));
  if (path === "/api/groups" && method === "POST") return respond(await createChatGroup(request, user, env));
  const groupMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)$/);
  if (groupMatch && method === "GET") return respond(await getGroupDetailsAndMessages(groupMatch[1], user, env));
  const groupMsgMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/messages$/);
  if (groupMsgMatch && method === "POST") return respond(await sendGroupMessage(request, groupMsgMatch[1], user, env));
  const groupMemberMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/members$/);
  if (groupMemberMatch && method === "POST") return respond(await addGroupMembers(request, groupMemberMatch[1], user, env));
  const groupKickMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/members\/kick$/);
  if (groupKickMatch && method === "POST") return respond(await kickGroupMember(request, groupKickMatch[1], user, env));
  const groupRoleMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/members\/role$/);
  if (groupRoleMatch && method === "POST") return respond(await setGroupMemberRole(request, groupRoleMatch[1], user, env));
  const groupTransferMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/members\/transfer-owner$/);
  if (groupTransferMatch && method === "POST") return respond(await transferGroupOwnership(request, groupTransferMatch[1], user, env));
  const groupBotMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/bot$/);
  if (groupBotMatch && method === "POST") return respond(await toggleGroupBot(request, groupBotMatch[1], user, env));

  if (path === "/api/chat/upload" && method === "POST") return respond(await handleChatUpload(request, user, env));
  if (path === "/api/user/heartbeat" && method === "POST") return respond(await handleHeartbeat(request, user, env));

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
      if (error instanceof HttpError || (error && typeof error.status === "number")) {
        return respond({ error: error.message }, error.status);
      }
      console.error("3TG API error", error && (error.stack || error.message) ? (error.stack || error.message) : error);
      return respond({ error: "3TG gặp trục trặc khi tải dữ liệu: " + (error?.message || "Lỗi hệ thống"), detail: error?.message }, 500);
    }
  }
};
