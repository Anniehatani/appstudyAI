const http = require("http");
const fs = require("fs");
const path = require("path");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf"
};

// Embedded default credentials fallback for packaged app
const DEFAULT_CONFIG = {
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || "",
  CLOUDFLARE_D1_DATABASE_ID: process.env.CLOUDFLARE_D1_DATABASE_ID || "",
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || "",
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || "",
  LOCAL_AI_ENDPOINT: process.env.LOCAL_AI_ENDPOINT || "https://api.deepseek.com/chat/completions",
  LOCAL_AI_MODEL: "deepseek-chat",
  DEEPSEEK_MODEL: "deepseek-chat",
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || "",
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || "",
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || "",
  R2_BUCKET_NAME: "my-project-bucket",
  R2_ENDPOINT: process.env.R2_ENDPOINT || "",
  VITE_R2_PUBLIC_URL: process.env.VITE_R2_PUBLIC_URL || ""
};

function loadEnvVars(rootPath) {
  const env = Object.assign({}, DEFAULT_CONFIG);
  const possiblePaths = [
    path.join(rootPath, ".dev.vars"),
    path.join(rootPath, ".env"),
    path.join(process.resourcesPath || rootPath, ".dev.vars"),
    path.join(process.resourcesPath || rootPath, "app/.dev.vars")
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf8");
        for (const line of content.split("\n")) {
          const t = line.trim();
          if (!t || t.startsWith("#")) continue;
          const idx = t.indexOf("=");
          if (idx > 0) {
            env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
          }
        }
      } catch {}
    }
  }
  return env;
}

const { pathToFileURL } = require("url");

async function startEmbeddedServer(rootPath, port = 8787) {
  const envVars = loadEnvVars(rootPath);
  const publicDir = path.resolve(rootPath, "public");

  // Tự động nạp Local SQLite Replica làm fallback DB khi Cloudflare D1 hết hạn ngạch hoặc mất mạng
  const sqliteCandidatePaths = [
    path.join(rootPath, "build/local_replica.sqlite"),
    path.join(process.resourcesPath || rootPath, "build/local_replica.sqlite"),
    path.join(rootPath, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/f75f832ec585bb85cc81d12168a8e118a5d2af5ffff0f316e6a87a595cb351ec.sqlite")
  ];
  for (const sPath of sqliteCandidatePaths) {
    if (fs.existsSync(sPath)) {
      try {
        const { DatabaseSync } = require("node:sqlite");
        const sqliteDb = new DatabaseSync(sPath);
        try {
          sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS user_academic_transcripts (
              user_id TEXT PRIMARY KEY,
              student_code TEXT,
              full_name TEXT,
              major TEXT,
              class_name TEXT,
              gpa_10 REAL,
              gpa_4 REAL,
              total_credits INTEGER,
              raw_data TEXT,
              ai_analysis TEXT,
              target_gpa REAL,
              last_synced_at TEXT,
              created_at TEXT
            );
          `);
        } catch {}
        envVars.DB = {
          prepare(sql) {
            return {
              bind(...params) {
                const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
                return {
                  async first(col) {
                    const stmt = sqliteDb.prepare(sql);
                    const row = stmt.get(...flat);
                    if (!row) return null;
                    if (col !== undefined) return row[col];
                    return row;
                  },
                  async all() {
                    const stmt = sqliteDb.prepare(sql);
                    const rows = stmt.all(...flat);
                    return { success: true, results: rows || [], meta: {} };
                  },
                  async run() {
                    const stmt = sqliteDb.prepare(sql);
                    const res = stmt.run(...flat);
                    return { success: true, meta: { changes: res.changes } };
                  },
                  async raw() {
                    const stmt = sqliteDb.prepare(sql);
                    const rows = stmt.all(...flat);
                    return rows.map(r => Object.values(r));
                  }
                };
              }
            };
          }
        };
        console.log("[EmbeddedServer] Đã nạp thành công Local D1 Replica từ:", sPath);
        break;
      } catch (err) {
        console.warn("[EmbeddedServer] Không thể khởi tạo sqlite fallback:", err.message);
      }
    }
  }

  // Dynamic import of ES Module worker
  const workerPath = path.resolve(rootPath, "src/index.js");
  let worker = null;
  try {
    const fileUrl = pathToFileURL(workerPath).href;
    const m = await import(fileUrl);
    worker = m.default;
  } catch (err) {
    console.error("[EmbeddedServer] Không thể import worker:", err);
  }

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
      const pathname = parsedUrl.pathname;

      // 1. API & MEDIA ROUTES (Delegated to Worker)
      if (pathname.startsWith("/api/") || pathname.startsWith("/media/")) {
        if (!worker) {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Worker engine chưa sẵn sàng." }));
          return;
        }

        try {
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (v) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
          }

          let body = null;
          if (req.method !== "GET" && req.method !== "HEAD") {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            body = Buffer.concat(chunks);
          }

          const webReq = new Request(parsedUrl.href, {
            method: req.method,
            headers,
            body: ["GET", "HEAD"].includes(req.method) ? undefined : body
          });

          const webRes = await worker.fetch(webReq, envVars);

          const resHeaders = {};
          webRes.headers.forEach((val, key) => {
            if (key.toLowerCase() === "set-cookie") {
              resHeaders["Set-Cookie"] = resHeaders["Set-Cookie"] || [];
              resHeaders["Set-Cookie"].push(val);
            } else {
              resHeaders[key] = val;
            }
          });

          res.writeHead(webRes.status, resHeaders);
          const buf = Buffer.from(await webRes.arrayBuffer());
          res.end(buf);
          return;
        } catch (err) {
          console.error("[EmbeddedServer API Error]", err);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message || "Lỗi xử lý API nội bộ." }));
          return;
        }
      }

      // 2. STATIC FILES (From public/ directory)
      let relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
      let targetFile = path.join(publicDir, relativePath);

      if (!fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory()) {
        targetFile = path.join(publicDir, "index.html");
      }

      const ext = path.extname(targetFile).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      try {
        const fileData = fs.readFileSync(targetFile);
        const isCodeFile = [".html", ".js", ".css"].includes(ext);
        res.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": isCodeFile ? "no-cache, no-store, must-revalidate" : "public, max-age=3600"
        });
        res.end(fileData);
      } catch (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }
    });

    server.once("listening", () => {
      const assignedPort = server.address().port;
      console.log(`[EmbeddedServer] Đã khởi chạy độc lập tại http://127.0.0.1:${assignedPort}`);
      resolve({ server, port: assignedPort, url: `http://127.0.0.1:${assignedPort}` });
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE" && port !== 0) {
        console.warn(`[EmbeddedServer] Cổng ${port} đang bận, tự động chuyển sang cổng ngẫu nhiên khả dụng...`);
        port = 0;
        server.listen(0, "127.0.0.1");
      } else {
        reject(err);
      }
    });

    server.listen(port, "127.0.0.1");
  });
}

module.exports = { startEmbeddedServer, loadEnvVars };
