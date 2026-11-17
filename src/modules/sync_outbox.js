// ========================================================
// ĐỒNG BỘ D1 - SQLITE: TRANSACTIONAL OUTBOX & REPLAY QUEUE
// Đảm bảo không mất dữ liệu khi offline & đối soát khi có mạng lại
// ========================================================

/**
 * Khởi tạo bảng lưu trữ Outbox trong Local SQLite
 */
export function initSyncOutbox(sqliteDb) {
  if (!sqliteDb || typeof sqliteDb.exec !== "function") return;
  try {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS sync_outbox (
        id TEXT PRIMARY KEY,
        sql TEXT NOT NULL,
        params TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        retry_count INTEGER NOT NULL DEFAULT 0,
        last_error TEXT DEFAULT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        synced_at TEXT DEFAULT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sync_outbox_status ON sync_outbox(status);
    `);
  } catch (err) {
    console.warn("[SyncOutbox Init Error]", err.message);
  }
}

/**
 * Ghi nhận một thao tác sửa đổi dữ liệu (INSERT/UPDATE/DELETE) vào Outbox
 * khi Cloudflare D1 bị mất kết nối mạng hoặc hết hạn ngạch
 */
export async function recordOutboxMutation(fallbackDb, sql, params = []) {
  if (!fallbackDb) return;
  try {
    const id = "outbox_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    const paramsJson = JSON.stringify(params || []);
    
    // Lưu vào bảng sync_outbox với trạng thái 'pending'
    await fallbackDb.prepare(
      "INSERT INTO sync_outbox (id, sql, params, status, retry_count, created_at) VALUES (?, ?, ?, 'pending', 0, CURRENT_TIMESTAMP)"
    ).bind(id, sql, paramsJson).run();
    
    console.log(`[SyncOutbox] Đã lưu thao tác ngoại tuyến vào Outbox (ID: ${id})`);
  } catch (err) {
    console.warn("[SyncOutbox Record Warning]", err.message);
  }
}

let isReplayingOutbox = false;

/**
 * Đối soát và phát lại (Replay) các thao tác ngoại tuyến từ Outbox lên Cloudflare D1
 */
export async function replayOutboxToD1(env, fallbackDb) {
  if (isReplayingOutbox || !fallbackDb) return { synced: 0, pending: 0 };
  
  const accountId = env?.CLOUDFLARE_ACCOUNT_ID;
  const dbId = env?.CLOUDFLARE_D1_DATABASE_ID;
  const token = env?.CLOUDFLARE_API_TOKEN;

  if (!accountId || !dbId || !token) {
    return { synced: 0, pending: 0, offline: true };
  }

  isReplayingOutbox = true;
  let syncedCount = 0;

  try {
    // 1. Lấy danh sách các thao tác chưa đồng bộ theo thứ tự phát sinh (FIFO)
    const pendingQuery = await fallbackDb.prepare(
      "SELECT id, sql, params, retry_count FROM sync_outbox WHERE status = 'pending' AND retry_count < 10 ORDER BY created_at ASC LIMIT 30"
    ).all().catch(() => ({ results: [] }));

    const pendingList = pendingQuery.results || [];
    if (!pendingList.length) {
      isReplayingOutbox = false;
      return { synced: 0, pending: 0 };
    }

    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`;

    for (const item of pendingList) {
      let params = [];
      try {
        params = JSON.parse(item.params);
      } catch {}

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ sql: item.sql, params })
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          // Thành công: Đánh dấu đã đồng bộ lên D1
          await fallbackDb.prepare(
            "UPDATE sync_outbox SET status = 'synced', synced_at = CURRENT_TIMESTAMP WHERE id = ?"
          ).bind(item.id).run();
          syncedCount++;
        } else {
          // Thất bại: Ghi log lỗi và tăng số lần thử lại (Backoff)
          const errMsg = (data.errors && data.errors[0]?.message) || `HTTP ${res.status}`;
          await fallbackDb.prepare(
            "UPDATE sync_outbox SET retry_count = retry_count + 1, last_error = ? WHERE id = ?"
          ).bind(errMsg, item.id).run();
        }
      } catch (netErr) {
        // Mất mạng: Tạm dừng vòng lặp replay, sẽ thử lại ở chu kỳ kế tiếp
        break;
      }
    }
  } catch (err) {
    console.warn("[SyncOutbox Replay Error]", err.message);
  } finally {
    isReplayingOutbox = false;
  }

  return { synced: syncedCount };
}

/**
 * Kiểm tra trạng thái hàng đợi Outbox
 */
export async function getOutboxStatus(fallbackDb) {
  if (!fallbackDb) return { pending: 0, synced: 0, failed: 0 };
  try {
    const res = await fallbackDb.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'synced' THEN 1 ELSE 0 END) AS synced,
        SUM(CASE WHEN status = 'pending' AND retry_count >= 10 THEN 1 ELSE 0 END) AS failed
      FROM sync_outbox
    `).first();

    return {
      pending: res?.pending || 0,
      synced: res?.synced || 0,
      failed: res?.failed || 0
    };
  } catch {
    return { pending: 0, synced: 0, failed: 0 };
  }
}
