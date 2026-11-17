// ========================================================
// BẢO MẬT XÁC THỰC: PBKDF2-HMAC-SHA256 & RATE LIMITING
// Chuẩn bảo mật cấp cao tương thích Cloudflare Worker & Node.js
// ========================================================

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_HASH_LEN = 256; // 32 bytes

function bufToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(hexString) {
  const bytes = new Uint8Array(Math.floor(hexString.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Băm mật khẩu sử dụng PBKDF2-HMAC-SHA256 với Salt ngẫu nhiên 16 bytes
 * Định dạng lưu trữ: pbkdf2:100000:<salt_hex>:<derived_hash_hex>
 */
export async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(String(password)),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    PBKDF2_HASH_LEN
  );

  const saltHex = bufToHex(salt);
  const hashHex = bufToHex(derivedBits);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * Xác minh mật khẩu ứng viên với mật khẩu đã lưu
 * Tự động hỗ trợ kiểm tra mật khẩu cũ (Legacy SHA-256) và báo hiệu cần nâng cấp (needsUpgrade: true)
 */
export async function verifyPassword(password, storedHash) {
  if (!password || !storedHash) {
    return { valid: false, needsUpgrade: false };
  }

  // 1. Định dạng mới: PBKDF2
  if (storedHash.startsWith("pbkdf2:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 4) return { valid: false, needsUpgrade: false };
    const iterations = parseInt(parts[1], 10) || PBKDF2_ITERATIONS;
    const salt = hexToBuf(parts[2]);
    const expectedHashHex = parts[3];

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(String(password)),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: iterations,
        hash: "SHA-256"
      },
      keyMaterial,
      PBKDF2_HASH_LEN
    );

    const candidateHashHex = bufToHex(derivedBits);
    const valid = timingSafeEqual(candidateHashHex, expectedHashHex);
    return { valid, needsUpgrade: false };
  }

  // 2. Định dạng cũ: Legacy SHA-256 với salt tĩnh (để người dùng cũ không bị mất tài khoản)
  const enc = new TextEncoder();
  const data = enc.encode(String(password) + "_lumi_salt_duo");
  const hash = await crypto.subtle.digest("SHA-256", data);
  const legacyHex = bufToHex(hash);
  const valid = timingSafeEqual(legacyHex, storedHash);

  // Nếu mật khẩu cũ đúng, đánh dấu needsUpgrade = true để tự động cập nhật sang PBKDF2 ngay sau đó
  return { valid, needsUpgrade: valid };
}

// ========================================================
// RATE LIMITER BẢO VỆ BRUTE-FORCE (CHỐNG DÒ MẬT KHẨU)
// ========================================================
const rateLimitMap = new Map();

/**
 * Kiểm tra giới hạn số lần thử (Rate Limit) cho Login/Register
 * @param {string} key IP hoặc Username
 * @param {number} maxAttempts Số lần thử tối đa (mặc định 5 lần)
 * @param {number} windowMs Thời gian khóa tạm thời (mặc định 15 phút)
 */
export function checkRateLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs };

  // Nếu đã qua khung thời gian giới hạn, reset bộ đếm
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  record.count += 1;
  rateLimitMap.set(key, record);

  // Dọn dẹp rác định kỳ (tránh phình bộ nhớ)
  if (rateLimitMap.size > 2000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetAt) rateLimitMap.delete(k);
    }
  }

  if (record.count > maxAttempts) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true, retryAfter: 0 };
}

export function resetRateLimit(key) {
  rateLimitMap.delete(key);
}
