const COOKIE_NAME = "lumi_session";
const COOKIE_AGE = 60 * 60 * 24 * 365;
const DEFAULT_SETTINGS = { dailyGoal: 15 };

function respond(data, status, extraHeaders) {
  const headers = new Headers(extraHeaders || {});
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
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
      throw new Error("Cloudflare D1 Error: " + (err.message || JSON.stringify(err)) + " [SQL: " + sql + "]");
    }
    const resultObj = (data.result && data.result[0]) || { results: [], meta: {} };
    return resultObj;
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

  // If last was today or yesterday -> streak is safe and active!
  if (last === today || last === yesterday) {
    return stats;
  }

  // If last was twoDaysAgo -> missed exactly yesterday
  if (last === twoDaysAgo) {
    const freeze = await db.prepare(
      "SELECT id, quantity FROM user_inventory WHERE user_id = ? AND item_code = 'streak_freeze' AND quantity > 0 LIMIT 1"
    ).bind(userId).first();

    if (freeze) {
      // Use streak freeze to protect yesterday!
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
      // No streak freeze -> HỦY CHUỖI!
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

  // If last was 3 or more days ago -> HỦY CHUỖI!
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
    "(SELECT COUNT(*) FROM units u WHERE u.subject_id = s.id) AS unit_count, " +
    "(SELECT COUNT(*) FROM lessons l JOIN units u2 ON u2.id = l.unit_id WHERE u2.subject_id = s.id) AS lesson_count " +
    "FROM subjects s ORDER BY s.id"
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
    "(SELECT MAX(p.status) FROM user_progress p WHERE p.user_id = ? AND p.lesson_id = l.id AND p.status = 'completed') AS progress_status " +
    "FROM subjects s LEFT JOIN units u ON u.subject_id = s.id " +
    "LEFT JOIN lessons l ON l.unit_id = u.id WHERE s.id = ? " +
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
    "SELECT l.id, l.unit_id, l.title, l.order_index, l.xp_reward, " +
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
  const completed = await env.DB.prepare(
    "SELECT id FROM user_progress WHERE user_id = ? AND lesson_id = ? AND status = 'completed' LIMIT 1"
  ).bind(userId, lessonId).first();
  if (completed) return true;
  const course = await env.DB.prepare(
    "SELECT subject_id FROM units u JOIN lessons l ON l.unit_id = u.id WHERE l.id = ?"
  ).bind(lessonId).first();
  if (!course) return false;
  const ordered = await env.DB.prepare(
    "SELECT l.id FROM lessons l JOIN units u ON u.id = l.unit_id WHERE u.subject_id = ? " +
    "ORDER BY u.order_index, u.id, l.order_index, l.id"
  ).bind(course.subject_id).all();
  const ids = (ordered.results || []).map(function (row) { return Number(row.id); });
  const index = ids.indexOf(Number(lessonId));
  if (index < 0) return false;
  if (index === 0) return true;
  const previous = await env.DB.prepare(
    "SELECT id FROM user_progress WHERE user_id = ? AND lesson_id = ? AND status = 'completed' LIMIT 1"
  ).bind(userId, ids[index - 1]).first();
  return Boolean(previous);
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
    "SELECT m.id, m.wrong_count, m.last_wrong_at, q.id AS question_id, q.question_text, q.lesson_id, " +
    "l.title AS lesson_title, s.subject_name FROM user_mistakes m JOIN questions q ON q.id = m.question_id " +
    "JOIN lessons l ON l.id = q.lesson_id JOIN units u ON u.id = l.unit_id JOIN subjects s ON s.id = u.subject_id " +
    "WHERE m.user_id = ? AND m.is_mastered = 0 ORDER BY m.wrong_count DESC, m.last_wrong_at DESC LIMIT 15"
  ).bind(user.userId).all();
  return response.results || [];
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

  const currentGuest = await sessionUser(request, env);
  const userId = currentGuest ? currentGuest.userId : crypto.randomUUID();
  const encryptedPassword = await hashPassword(password);
  const accountId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const profileId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const today = vietDate();
  const weekStart = mondayDate(today);

  const ops = [
    env.DB.prepare(
      "INSERT INTO accounts (id, user_id, service_name, username, encrypted_password, created_at) VALUES (?, ?, 'local', ?, ?, ?)"
    ).bind(accountId, userId, username, encryptedPassword, today)
  ];

  if (currentGuest) {
    ops.push(
      env.DB.prepare("UPDATE profiles SET full_name = ? WHERE user_id = ?").bind(fullName, userId)
    );
  } else {
    ops.push(
      env.DB.prepare("INSERT INTO profiles (id, user_id, full_name, avatar_url, bio, cover_url, school, major, created_at) VALUES (?, ?, ?, NULL, '', NULL, NULL, NULL, ?)").bind(profileId, userId, fullName, today),
      env.DB.prepare("INSERT OR IGNORE INTO user_stats (user_id, total_xp, current_streak, longest_streak, hearts, gems, last_active_date) VALUES (?, 0, 0, 0, 5, 50, ?)").bind(userId, today),
      env.DB.prepare("INSERT OR IGNORE INTO user_inventory (user_id, item_code, quantity) VALUES (?, 'streak_freeze', 1)").bind(userId),
      env.DB.prepare("INSERT OR IGNORE INTO weekly_leaderboards (user_id, league_name, weekly_xp, week_start_date) VALUES (?, 'Bronze', 0, ?)").bind(userId, weekStart)
    );
  }

  await env.DB.batch(ops);

  const profile = await env.DB.prepare(
    "SELECT id, user_id, full_name, avatar_url, bio, cover_url, school, major, created_at FROM profiles WHERE user_id = ? LIMIT 1"
  ).bind(userId).first();
  const stats = await env.DB.prepare(
    "SELECT * FROM user_stats WHERE user_id = ? LIMIT 1"
  ).bind(userId).first();

  return respond(
    { ok: true, user: profile, stats: stats || {}, message: "Tạo tài khoản thành công! Tặng bạn 50 Đá quý 💎 chào mừng!" },
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
    "SELECT id, user_id, full_name, avatar_url, bio, cover_url FROM profiles WHERE user_id = ? LIMIT 1"
  ).bind(account.user_id).first();
  const stats = await env.DB.prepare(
    "SELECT * FROM user_stats WHERE user_id = ? LIMIT 1"
  ).bind(account.user_id).first();

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
  const isCorrect = Boolean(body.isCorrect);

  const mistake = await env.DB.prepare(
    "SELECT id, question_id, is_mastered FROM user_mistakes WHERE id = ? AND user_id = ? LIMIT 1"
  ).bind(mistakeId, user.userId).first();
  if (!mistake) throw new HttpError(404, "Không tìm thấy câu hỏi ôn tập này.");

  const ops = [];
  if (isCorrect) {
    ops.push(env.DB.prepare("UPDATE user_mistakes SET is_mastered = 1 WHERE id = ?").bind(mistakeId));
    ops.push(env.DB.prepare("UPDATE user_stats SET hearts = MIN(5, hearts + 1), total_xp = total_xp + 5 WHERE user_id = ?").bind(user.userId));
  } else {
    ops.push(env.DB.prepare("UPDATE user_mistakes SET wrong_count = wrong_count + 1, last_wrong_at = CURRENT_TIMESTAMP WHERE id = ?").bind(mistakeId));
  }
  await env.DB.batch(ops);
  const updatedStats = await env.DB.prepare("SELECT * FROM user_stats WHERE user_id = ? LIMIT 1").bind(user.userId).first();
  return { ok: true, stats: updatedStats, restoredHeart: isCorrect };
}

async function leaderboard(user, env) {
  const weekStart = mondayDate(vietDate());
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

  return { weekStart: weekStart, league: "Bronze", rows: rows };
}

async function askAI(request, user, env) {
  const body = await readJson(request);
  const message = String(body.message || "").trim().slice(0, 1800);
  if (!message) throw new HttpError(400, "Viết câu hỏi trước khi gửi nhé.");
  const apiKey = env.DEEPSEEK_API_KEY || env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey) throw new HttpError(503, "Chưa cấu hình khóa AI trên Worker. Thêm secret DEEPSEEK_API_KEY để bật trợ giảng.");
  const model = env.DEEPSEEK_MODEL || env.VITE_DEEPSEEK_MODEL || "deepseek-chat";
  let courseTitle = "";
  let context = "";
  if (body.subjectId) {
    const subject = await env.DB.prepare("SELECT subject_name FROM subjects WHERE id = ?").bind(body.subjectId).first();
    if (subject) {
      courseTitle = subject.subject_name;
      context = await courseSnippets(env, courseTitle, message);
    }
  }
  const systemText = "Bạn là 3TG AI, trợ giảng học tập thân thiện và thông minh bằng tiếng Việt của Web học 3TG. " +
    "Giải thích rõ ràng, gần gũi, theo từng bước khi phù hợp. Không bịa thông tin về tài liệu môn học. " +
    "Nếu câu hỏi cần dữ liệu mà phần ngữ cảnh không có, hãy nói rõ điều đó rồi giải thích phần kiến thức chung với nhãn phân biệt. " +
    "Khuyến khích người học tự suy nghĩ và không tiết lộ đáp án trắc nghiệm nếu họ chưa hỏi.";
  const contextText = "Môn đang học: " + (courseTitle || "chưa chọn") + ".\n" +
    (context ? "Trích đoạn liên quan từ dữ liệu môn học:\n" + context :
      "Không tìm thấy hoặc chưa chọn trích đoạn tài liệu phù hợp; đừng nói rằng bạn đã đọc tài liệu của môn.");
  const history = Array.isArray(body.history) ? body.history.slice(-8).map(function (item) {
    const role = item && (item.role === "assistant" || item.role === "user") ? item.role : "";
    return role && item.content ? { role: role, content: String(item.content).slice(0, 1500) } : null;
  }).filter(Boolean) : [];
  let response;
  try {
    response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + apiKey },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemText + "\n\n" + contextText },
          ...history,
          { role: "user", content: message }
        ],
        temperature: 0.55,
        max_tokens: 900
      }),
      signal: AbortSignal.timeout(25000)
    });
  } catch {
    throw new HttpError(502, "3TG chưa kết nối được với trợ giảng AI. Thử gửi lại sau một chút nhé.");
  }
  if (!response.ok) throw new HttpError(502, "Trợ giảng 3TG AI đang bận. Bạn thử lại sau một chút nhé.");
  let result;
  try {
    result = await response.json();
  } catch {
    throw new HttpError(502, "Trợ giảng AI trả về phản hồi chưa đọc được.");
  }
  const reply = result && result.choices && result.choices[0] && result.choices[0].message
    ? String(result.choices[0].message.content || "")
    : "";
  if (!reply) throw new HttpError(502, "3TG chưa nhận được câu trả lời. Thử hỏi lại nhé.");
  return { reply: reply };
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
  const user = await requireUser(request, env);
  if (path === "/api/me" && method === "GET") {
    const stats = await env.DB.prepare("SELECT * FROM user_stats WHERE user_id = ? LIMIT 1").bind(user.userId).first();
    const inv = await env.DB.prepare("SELECT item_code, quantity FROM user_inventory WHERE user_id = ?").bind(user.userId).all();
    return respond({ profile: user.profile, stats: stats || {}, inventory: inv.results || [] });
  }
  if (path === "/api/overview" && method === "GET") return respond(await overview(user, env));
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
  if (path === "/api/leaderboard" && method === "GET") return respond(await leaderboard(user, env));
  if (path === "/api/chat" && method === "POST") return respond(await askAI(request, user, env));
  const lessonMatch = path.match(/^\/api\/lessons\/(\d+)$/);
  if (lessonMatch && method === "GET") return respond(await lessonData(Number(lessonMatch[1]), user.userId, env));
  const checkMatch = path.match(/^\/api\/lessons\/(\d+)\/check$/);
  if (checkMatch && method === "POST") {
    const body = await readJson(request);
    if (!await lessonIsUnlocked(Number(checkMatch[1]), user.userId, env)) {
      throw new HttpError(423, "Hoàn thành bài trước để mở khóa bài này nhé.");
    }
    const row = await env.DB.prepare(
      "SELECT correct_answer, explanation FROM questions WHERE id = ?"
    ).bind(body.questionId).first();
    if (!row) throw new HttpError(404, "Không tìm thấy câu hỏi này.");
    return respond({
      isCorrect: normalizeAnswer(body.selected) !== "" && normalizeAnswer(body.selected) === normalizeAnswer(row.correct_answer),
      correctAnswer: normalizeAnswer(row.correct_answer),
      explanation: row.explanation || ""
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
