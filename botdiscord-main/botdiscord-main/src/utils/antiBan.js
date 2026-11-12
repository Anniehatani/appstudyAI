/**
 * Hàng đợi gửi tin nhắn và giới hạn tần suất sử dụng của bot.
 * Tên AntiBanEngine được giữ để tương thích với mã gọi hiện tại.
 * Các cơ chế này không bảo đảm tránh checkpoint hoặc khóa tài khoản.
 */

const fs = require("fs-extra");
const chalk = require("chalk");

function outboxError(code, message) {
    return Object.assign(new Error(message), { code });
}

// ws3-fca có thể làm mất HTTP status khi chuyển lỗi thành Error(message).
// Chỉ dừng dựa trên status hoặc thông báo xác thực rõ ràng, không đoán từ lỗi mạng.
function getOutboxHaltCode(error) {
    const message = [error?.message, error?.error]
        .filter(value => typeof value === "string")
        .join(" ");
    const statusFromMessage = message.match(/parseAndCheckLogin got status code:\s*(401|403|429)\b/i);
    const statuses = [error?.status, error?.statusCode, error?.response?.status, statusFromMessage?.[1]]
        .map(Number);

    if (statuses.includes(429)) return "OUTBOX_RATE_LIMITED";
    if (statuses.includes(401) || statuses.includes(403) ||
        /checkpoint|not logged in|facebook blocked the login|session (?:has )?expired/i.test(message)) {
        return "OUTBOX_AUTH_REQUIRED";
    }
    return null;
}

class AntiBanEngine {
    constructor(options = {}) {
        this.options = {
            enabled: options.enabled ?? true,
            humanTyping: options.humanTyping ?? true,
            minTypingDelayMs: options.minTypingDelayMs || 800,
            maxTypingDelayMs: options.maxTypingDelayMs || 3200,
            msPerCharacter: options.msPerCharacter || 25, // giả lập tốc độ gõ phím
            jitterMs: options.jitterMs || 300,            // độ trễ ngẫu nhiên +/- 300ms
            userCooldownMs: options.userCooldownMs || 2500, // nghỉ giữa các lệnh của 1 user
            maxViolations: options.maxViolations || 3,       // spam quá 3 lần -> mute
            blacklistDurationMs: options.blacklistDurationMs || 3 * 60 * 1000, // Mute 3 phút
            outboxIntervalMs: options.outboxIntervalMs || 1200, // Khoảng nghỉ cấu hình giữa 2 tác vụ
            maxOutboxQueueSize: 100, // Số tin đang chờ tối đa, không tính tin đang gửi
            autoSaveAppStateIntervalMs: options.autoSaveAppStateIntervalMs || 30 * 60 * 1000, // Lưu bản sao cookie mỗi 30p
            ...options
        };

        if (!Number.isInteger(this.options.maxOutboxQueueSize) || this.options.maxOutboxQueueSize < 1) {
            throw new RangeError("maxOutboxQueueSize phải là số nguyên dương.");
        }

        this.userLastAction = new Map();
        this.userViolations = new Map();
        this.blacklistedUsers = new Map();

        // Hàng đợi tin nhắn đi ra (Outbox Queue)
        this.outboxQueue = [];
        this.isProcessingQueue = false;
        this.outboxHaltCode = null;
        this.appStateSaveTimer = null;
    }

    /**
     * Tạo độ trễ ngẫu nhiên (Jitter)
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Tính toán thời gian gõ phím giống người thật dựa trên độ dài nội dung
     */
    calculateTypingDelay(text) {
        if (!this.options.humanTyping) return 200;
        const length = typeof text === "string" ? text.length : (text?.body ? text.body.length : 20);
        const baseDelay = Math.min(
            this.options.maxTypingDelayMs,
            Math.max(this.options.minTypingDelayMs, length * this.options.msPerCharacter)
        );
        // Độ trễ hiển thị trạng thái gõ; không phải biện pháp bảo đảm tránh phát hiện.
        const randomJitter = Math.floor(Math.random() * (this.options.jitterMs * 2 + 1)) - this.options.jitterMs;
        return Math.max(500, baseDelay + randomJitter);
    }

    /**
     * Kiểm tra Rate Limit người dùng (Anti-Spam / Anti-Flood)
     * @param {string} userID 
     * @param {boolean} isAdminUser 
     * @returns {{ allowed: boolean, reason?: string, timeLeft?: number, action?: string }}
     */
    checkUserRateLimit(userID, isAdminUser = false) {
        if (!this.options.enabled || isAdminUser) {
            return { allowed: true };
        }

        const now = Date.now();

        // 1. Kiểm tra xem người dùng có đang trong danh sách đen tạm thời (Blacklist)
        if (this.blacklistedUsers.has(userID)) {
            const expireAt = this.blacklistedUsers.get(userID);
            if (now < expireAt) {
                const timeLeft = Math.ceil((expireAt - now) / 1000);
                return {
                    allowed: false,
                    reason: `⛔ Bạn đang bị tạm khóa vì spam lệnh! Vui lòng chờ ${timeLeft} giây.`,
                    timeLeft,
                    action: "BLACKLISTED"
                };
            } else {
                // Hết hạn phạt
                this.blacklistedUsers.delete(userID);
                this.userViolations.delete(userID);
            }
        }

        // 2. Kiểm tra Cooldown bình thường
        const lastAction = this.userLastAction.get(userID) || 0;
        const timePassed = now - lastAction;

        if (timePassed < this.options.userCooldownMs) {
            const violations = (this.userViolations.get(userID) || 0) + 1;
            this.userViolations.set(userID, violations);

            // Nếu vi phạm liên tục vượt ngưỡng -> Tạm khóa
            if (violations >= this.options.maxViolations) {
                const expireAt = now + this.options.blacklistDurationMs;
                this.blacklistedUsers.set(userID, expireAt);
                const muteMinutes = Math.round(this.options.blacklistDurationMs / 60000);
                return {
                    allowed: false,
                    reason: `🚨 Bạn đã gửi lệnh quá nhanh! Bot tạm bỏ qua lệnh của bạn trong ${muteMinutes} phút để hạn chế spam.`,
                    action: "JUST_BLACKLISTED"
                };
            }

            const waitTime = ((this.options.userCooldownMs - timePassed) / 1000).toFixed(1);
            return {
                allowed: false,
                reason: `⏳ Bạn thao tác quá nhanh! Vui lòng chờ ${waitTime}s trước khi gõ lệnh tiếp theo.`,
                timeLeft: parseFloat(waitTime),
                action: "COOLDOWN_WARNING"
            };
        }

        // Cập nhật thời điểm thao tác hợp lệ
        this.userLastAction.set(userID, now);
        // Reset dần vi phạm nếu user dùng bình thường
        if (this.userViolations.get(userID) > 0) {
            this.userViolations.set(userID, Math.max(0, this.userViolations.get(userID) - 1));
        }

        return { allowed: true };
    }

    /**
     * Đưa tin nhắn vào hàng đợi có giới hạn.
     * @param {object} api - Thư viện FCA api
     * @param {string|object} messageContent - Nội dung tin nhắn ({ body, attachment, ... })
     * @param {string} threadID - ID nhóm hoặc ID người nhận
     * @param {string} [replyToMessageID] - ID tin nhắn phản hồi (nếu có)
     * @returns {Promise<any>}
     */
    async safeSendMessage(api, messageContent, threadID, replyToMessageID = null) {
        if (this.outboxHaltCode) {
            throw outboxError(this.outboxHaltCode, "Hàng đợi đã dừng. Cần kiểm tra quyền truy cập và giới hạn trước khi khởi động lại.");
        }
        if (this.outboxQueue.length >= this.options.maxOutboxQueueSize) {
            throw outboxError("OUTBOX_FULL", "Hàng đợi đã đầy; tin nhắn chưa được nhận để gửi.");
        }
        return new Promise((resolve, reject) => {
            this.outboxQueue.push({
                api,
                messageContent,
                threadID,
                replyToMessageID,
                resolve,
                reject,
                enqueuedAt: Date.now()
            });

            this.processOutboxQueue();
        });
    }

    haltOutbox(code) {
        this.outboxHaltCode = code;
        for (const task of this.outboxQueue.splice(0)) {
            task.reject(outboxError(code, "Hàng đợi đã dừng; tin nhắn đang chờ chưa được gửi."));
        }
    }

    /**
     * Bộ máy xử lý hàng đợi tin nhắn tuần tự (Throttling)
     */
    async processOutboxQueue() {
        if (this.isProcessingQueue || this.outboxQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        try {
            while (this.outboxQueue.length > 0) {
                const task = this.outboxQueue.shift();
                const { api, messageContent, threadID, replyToMessageID, resolve, reject } = task;

                try {
                    const targetThread = String(threadID);
                    const validReplyID = (typeof replyToMessageID === "string" && replyToMessageID.trim().length > 0)
                        ? String(replyToMessageID).trim()
                        : undefined;

                    if (typeof api.markAsRead === "function") {
                        try {
                            await api.markAsRead(targetThread);
                        } catch (e) {}
                    }

                    const typingDelay = this.calculateTypingDelay(messageContent);
                    if (typeof api.sendTypingIndicator === "function") {
                        try {
                            await api.sendTypingIndicator(true, targetThread);
                        } catch (e) {}
                    }

                    await this.sleep(typingDelay);

                    if (typeof api.sendTypingIndicator === "function") {
                        try {
                            await api.sendTypingIndicator(false, targetThread);
                        } catch (e) {}
                    }

                    // ws3-fca@3.5.2 dùng Promise. Chỉ gọi một lần; lỗi hoặc timeout
                    // không chứng minh tin chưa gửi, nên không tự gửi lại bỏ reply ID.
                    const sendPromise = api.sendMessage(messageContent, targetThread, validReplyID);
                    if (!sendPromise || typeof sendPromise.then !== "function") {
                        throw outboxError("OUTBOX_UNSUPPORTED_API", "Cần sendMessage trả về Promise; kết quả gửi hiện chưa xác định.");
                    }
                    resolve(await sendPromise);

                } catch (error) {
                    const haltCode = getOutboxHaltCode(error);
                    if (haltCode) this.haltOutbox(haltCode);
                    console.warn(chalk.yellow(`[ OUTBOX ] ${haltCode || "SEND_FAILED"}; không tự gửi lại.`));
                    reject(error);
                } finally {
                    // Giữ khoảng nghỉ kể cả sau lỗi; không xử lý dồn các tin còn lại.
                    await this.sleep(this.options.outboxIntervalMs);
                }
            }
        } finally {
            this.isProcessingQueue = false;
        }
    }

    /**
     * Lưu bản sao cookie hiện có trong jar; không gia hạn phiên ở phía Facebook.
     */
    async saveAppStateToFile(api, appStatePath) {
        try {
            if (!api || typeof api.getAppState !== "function") return;
            const state = api.getAppState();
            if (Array.isArray(state) && state.length > 0) {
                const tempPath = `${appStatePath}.tmp`;
                await fs.writeJson(tempPath, state, { spaces: 2 });
                await fs.move(tempPath, appStatePath, { overwrite: true });
                console.log(chalk.green(`[ SESSION ] Đã lưu bản sao cookie hiện có vào appstate.json.`));
            }
        } catch (err) {
            console.warn(chalk.yellow(`[ ANTI-BAN WARN ] Không thể tự động lưu appstate.json:`), err.message);
        }
    }

    /**
     * Bắt đầu chu kỳ tự động lưu AppState định kỳ
     */
    startAppStateAutoSaver(api, appStatePath) {
        if (this.appStateSaveTimer) clearInterval(this.appStateSaveTimer);
        this.appStateSaveTimer = setInterval(() => {
            this.saveAppStateToFile(api, appStatePath);
        }, this.options.autoSaveAppStateIntervalMs);
    }

    /**
     * Dừng timer lưu AppState khi tắt bot
     */
    stopAppStateAutoSaver() {
        if (this.appStateSaveTimer) {
            clearInterval(this.appStateSaveTimer);
            this.appStateSaveTimer = null;
        }
    }
}

module.exports = AntiBanEngine;

