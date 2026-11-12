/**
 * =======================================================================
 * BOT MESSENGER - HÀNG ĐỢI TIN NHẮN VÀ GIỚI HẠN TẦN SUẤT
 * =======================================================================
 * 
 * Hàng đợi có giới hạn, cooldown mỗi người dùng và lưu bản sao cookie.
 * API không chính thức không bảo đảm tránh checkpoint hoặc khóa tài khoản.
 */

require("dotenv").config();
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const moment = require("moment-timezone");
const axios = require("axios");

// Nạp thư viện FCA
let fcaLogin;
try {
    const fcaModule = require("ws3-fca");
    fcaLogin = typeof fcaModule === "function" ? fcaModule : (fcaModule.login || fcaModule.default);
} catch (err) {
    console.error(chalk.red("\n❌ Không thể nạp thư viện ws3-fca:"), err.message);
    process.exit(1);
}

const AntiBanEngine = require("./src/utils/antiBan");
const { getConfig, getSettings, isAdmin, isNDH, getPrefix } = require("./src/utils/settings");
const { shouldTriggerBotAI, handleMessengerAIChat, ADMIN_NAME, ADMIN_UID } = require("./src/utils/beAnhAI");

function getTime() {
    return moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
}

function getTimestamp() {
    return moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");
}

// Biến toàn cục lưu Bot UID
let currentBotUID = null;

// 1. TẢI CẤU HÌNH VÀ THIẾT LẬP ANTI-BAN
const config = getConfig();
const messengerConfig = config.MESSENGER || {};
const antiBanConfig = config.ANTI_BAN || {};

const PREFIX = messengerConfig.PREFIX || config.PREFIX || "!";
const BOT_NAME = config.BOTNAME || "Annie VIP PRO";
const APPSTATE_PATH = path.resolve(__dirname, messengerConfig.APPSTATE_PATH || "./appstate.json");

// Khởi tạo Bộ máy Chống Ban
const antiBan = new AntiBanEngine({
    enabled: antiBanConfig.ENABLED !== false,
    humanTyping: antiBanConfig.HUMAN_TYPING !== false,
    minTypingDelayMs: antiBanConfig.MIN_DELAY_MS || 800,
    maxTypingDelayMs: antiBanConfig.MAX_DELAY_MS || 3000,
    msPerCharacter: antiBanConfig.MS_PER_CHAR || 25,
    jitterMs: antiBanConfig.JITTER_MS || 300,
    userCooldownMs: antiBanConfig.USER_COOLDOWN_MS || 2500,
    maxViolations: antiBanConfig.MAX_SPAM_VIOLATIONS || 3,
    blacklistDurationMs: (antiBanConfig.BLACKLIST_DURATION_MINUTES || 3) * 60 * 1000,
    outboxIntervalMs: antiBanConfig.OUTBOX_INTERVAL_MS || 1200,
    maxOutboxQueueSize: antiBanConfig.MAX_OUTBOX_QUEUE_SIZE ?? 100,
    autoSaveAppStateIntervalMs: (antiBanConfig.AUTO_SAVE_APPSTATE_MINUTES || 20) * 60 * 1000
});

// 2. KIỂM TRA FILE APPSTATE.JSON
function checkAppState() {
    if (!fs.existsSync(APPSTATE_PATH)) {
        printAppStateWarning("Không tìm thấy file appstate.json!");
        process.exit(1);
    }

    try {
        const raw = fs.readFileSync(APPSTATE_PATH, "utf8");
        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed) || parsed.length === 0) {
            printAppStateWarning("File appstate.json rỗng hoặc không đúng định dạng mảng cookie!");
            process.exit(1);
        }

        const hasCUser = parsed.some(c => c.key === "c_user" && c.value && !c.value.includes("DÁN_UID"));
        const hasXs = parsed.some(c => c.key === "xs" && c.value && !c.value.includes("DÁN_COOKIE"));

        if (!hasCUser || !hasXs) {
            printAppStateWarning("appstate.json chưa có cookie c_user hoặc xs hợp lệ!");
            process.exit(1);
        }

        return parsed;
    } catch (e) {
        printAppStateWarning(`File appstate.json lỗi cú pháp JSON: ${e.message}`);
        process.exit(1);
    }
}

function printAppStateWarning(message) {
    console.log(chalk.bold.red(`\n╔═══════════════════════════════════════════════════════════════════╗`));
    console.log(chalk.bold.red(`║           🚨 CẢNH BÁO APPSTATE.JSON CHƯA HỢP LỆ!                 ║`));
    console.log(chalk.bold.red(`╠═══════════════════════════════════════════════════════════════════╣`));
    console.log(chalk.yellow(`║  Lý do: ${message.padEnd(58)}║`));
    console.log(chalk.cyan(`║                                                                   ║`));
    console.log(chalk.cyan(`║  👉 KIỂM TRA CẤU HÌNH PHIÊN APPSTATE:                             ║`));
    console.log(chalk.white(`║  1. Đăng nhập Facebook trên trình duyệt Chrome máy tính.          ║`));
    console.log(chalk.white(`║  2. Dùng Extension "c3c-fbstate" hoặc "Get FB State" để trích xuất║`));
    console.log(chalk.white(`║     toàn bộ cookie dưới dạng JSON.                                ║`));
    console.log(chalk.white(`║  3. Mở file "appstate.json" và dán toàn bộ đoạn mã JSON vào.      ║`));
    console.log(chalk.white(`║  4. Lưu ý: KHÔNG BẤM ĐĂNG XUẤT trên trình duyệt sau khi lấy!      ║`));
    console.log(chalk.bold.red(`╚═══════════════════════════════════════════════════════════════════╝\n`));
}

const appStateData = checkAppState();

// 3. TẢI CÁC LỆNH (COMMANDS LOADER)
const commands = new Map();
const aliases = new Map();
const commandsDir = path.join(__dirname, "src", "commands");

function loadCommands(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            loadCommands(fullPath);
        } else if (file.endsWith(".js")) {
            try {
                const command = require(fullPath);
                if (!command.name) continue;
                const cmdName = command.name.toLowerCase();
                commands.set(cmdName, command);

                if (Array.isArray(command.aliases)) {
                    for (const alias of command.aliases) {
                        aliases.set(alias.toLowerCase(), cmdName);
                    }
                }
            } catch (err) {
                console.warn(chalk.yellow(`[ CẢNH BÁO NẠP LỆNH: ${file} ]`), err.message);
            }
        }
    }
}
loadCommands(commandsDir);

// 4. BỘ XỬ LÝ ATTACHMENT STREAM CHO MESSENGER
async function downloadAttachment(url) {
    try {
        const tempDir = path.join(__dirname, "data", "temp");
        await fs.ensureDir(tempDir);
        const ext = url.split("?")[0].split(".").pop() || "mp4";
        const tempFile = path.join(tempDir, `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`);

        const response = await axios({
            method: "GET",
            url,
            responseType: "stream",
            timeout: 25000
        });

        const writer = fs.createWriteStream(tempFile);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        // Xóa file tạm sau 60 giây
        setTimeout(() => {
            try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (e) {}
        }, 60000);

        return fs.createReadStream(tempFile);
    } catch (e) {
        console.error("Lỗi tải attachment:", e.message);
        return null;
    }
}

async function resolveReadableAttachment(source) {
    if (!source) return null;

    // 1. Nếu là URL online
    if (typeof source === "string" && (source.startsWith("http://") || source.startsWith("https://"))) {
        return await downloadAttachment(source);
    }

    // 2. Nếu là AttachmentBuilder của Discord (source.attachment là filePath hoặc Stream)
    let actualSource = source;
    if (source && typeof source === "object") {
        if (source.attachment) {
            actualSource = source.attachment;
        } else if (source.file) {
            actualSource = source.file;
        }
    }

    // 3. Nếu là file path cục bộ trên ổ cứng
    if (typeof actualSource === "string" && fs.existsSync(actualSource)) {
        return fs.createReadStream(actualSource);
    }

    // 4. Nếu đã là Readable Stream
    if (actualSource && typeof actualSource.pipe === "function") {
        return actualSource;
    }

    return null;
}

// 5. CHUYỂN ĐỔI DISCORD EMBED / PAYLOAD SANG MESSENGER PAYLOAD
async function formatMessagePayload(response) {
    let bodyText = "";
    let rawAttachment = null;

    if (typeof response === "string") {
        bodyText = response;
    } else if (response && typeof response === "object") {
        // Chuyển đổi Discord Embed sang Text Messenger đẹp mắt
        if (Array.isArray(response.embeds) && response.embeds.length > 0) {
            const emb = response.embeds[0];
            const lines = [];
            if (emb.data?.title) lines.push(`📌 ${emb.data.title}`);
            if (emb.data?.description) lines.push(emb.data.description);
            if (Array.isArray(emb.data?.fields) && emb.data.fields.length > 0) {
                for (const f of emb.data.fields) {
                    lines.push(`▫️ ${f.name}: ${f.value}`);
                }
            }
            if (emb.data?.footer?.text) {
                lines.push(`\n📝 ${emb.data.footer.text}`);
            }
            bodyText = lines.join("\n\n");
        } else if (response.content) {
            bodyText = response.content;
        } else if (response.body) {
            bodyText = response.body;
        }

        // Kiểm tra file đính kèm
        if (Array.isArray(response.files) && response.files.length > 0) {
            rawAttachment = response.files[0]?.attachment || response.files[0];
        } else if (response.attachment) {
            rawAttachment = response.attachment;
        }
    }

    let attachmentStream = null;
    if (rawAttachment) {
        attachmentStream = await resolveReadableAttachment(rawAttachment);
    }

    if (attachmentStream) {
        return {
            body: bodyText || "",
            attachment: attachmentStream
        };
    }

    return bodyText || " ";
}

// 6. CẤU HÌNH LOGIN OPTIONS CHO FCA
const loginOptions = {
    appState: appStateData
};

const fcaOptions = {
    listenEvents: true,
    selfListen: false,           // Bỏ qua tin nhắn của chính bot (chống loop)
    logLevel: "silent",
    updatePresence: true,        // Online tự nhiên
    forceLogin: true,
    autoMarkDelivery: true,
    autoMarkRead: false,         // Để AntiBanEngine chủ động mark as read kèm typing delay
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
};

if (messengerConfig.PROXY) {
    fcaOptions.proxy = messengerConfig.PROXY;
    console.log(chalk.cyan(`[ PROXY ] Đã cấu hình proxy; ẩn địa chỉ và thông tin xác thực.`));
}

// 7. KHỞI CHẠY BOT MESSENGER
console.log(chalk.bold.blue(`[ ${getTimestamp()} ] 🚀 Đang kết nối tới Facebook Messenger API bằng AppState...`));

fcaLogin(loginOptions, fcaOptions, (err, api) => {
    if (err) {
        console.error(chalk.bold.red("\n❌ LỖI ĐĂNG NHẬP MESSENGER:"));
        console.error(chalk.red(err.error || err.message || JSON.stringify(err)));
        console.log(chalk.yellow("\n💡 Lời khuyên:"));
        console.log(chalk.yellow("- Cookie trong appstate.json có thể đã hết hạn hoặc bị Facebook Checkpoint."));
        console.log(chalk.yellow("- Hãy đăng nhập lại Facebook trên trình duyệt và lấy lại file appstate.json mới nhất.\n"));
        process.exit(1);
    }

    try {
        api.setOptions(fcaOptions);
    } catch (e) {}

    currentBotUID = String(api.getCurrentUserID());
    const startTime = getTime();

    // Banner Console
    console.log(chalk.bold.magenta(`\n╔═══════════════════════════════════════════════════════════════╗`));
    console.log(chalk.bold.magenta(`║           ANNIE MESSENGER BOT - HÀNG ĐỢI TIN NHẮN             ║`));
    console.log(chalk.bold.magenta(`╠═══════════════════════════════════════════════════════════════╣`));
    console.log(chalk.bold.cyan(`║  🤖 Tên Bot         : ${BOT_NAME.padEnd(39)}║`));
    console.log(chalk.bold.cyan(`║  🆔 Facebook UID    : ${currentBotUID.padEnd(39)}║`));
    console.log(chalk.bold.cyan(`║  👑 Admin Bot       : ${`${ADMIN_NAME} (${ADMIN_UID})`.padEnd(39)}║`));
    console.log(chalk.bold.cyan(`║  ⚡ Tiền tố lệnh    : ${PREFIX.padEnd(39)}║`));
    console.log(chalk.bold.cyan(`║  🧠 AI Engine       : ${"Groq Cloud (Qwen 3.8 / GPT OSS 120B)".padEnd(39)}║`));
    console.log(chalk.bold.cyan(`║  🎵 YouTube Music   : ${"Tự động qua AI & Lệnh (!sing/!ytb)".padEnd(39)}║`));
    console.log(chalk.bold.green(`║  🛡️ Hàng đợi gửi tin: ${"BẬT (giới hạn tần suất)".padEnd(39)}║`));
    console.log(chalk.bold.green(`║  ⏳ Gõ phím giả lập : ${`${antiBan.options.minTypingDelayMs}ms - ${antiBan.options.maxTypingDelayMs}ms (+Jitter)`.padEnd(39)}║`));
    console.log(chalk.bold.green(`║  🛑 Anti-Spam User  : ${`${antiBan.options.userCooldownMs}ms (Khóa sau ${antiBan.options.maxViolations} lần)`.padEnd(39)}║`));
    console.log(chalk.bold.green(`║  ⏰ Khởi động lúc   : ${startTime.padEnd(39)}║`));
    console.log(chalk.bold.magenta(`╚═══════════════════════════════════════════════════════════════╝`));
    console.log(chalk.bold.green(`[ ${getTimestamp()} ] 🎧 Bot đang lắng nghe tin nhắn Messenger qua giao thức MQTT...\n`));

    // Khởi động đồng bộ AppState định kỳ
    antiBan.startAppStateAutoSaver(api, APPSTATE_PATH);

    // Lắng nghe sự kiện qua MQTT
    api.listenMqtt(async (listenErr, event) => {
        if (listenErr) {
            console.error(chalk.red(`[ LỖI MQTT ]: `), listenErr);
            return;
        }

        if (!event) return;

        // Bỏ qua tin nhắn do chính bot gửi
        if (String(event.senderID) === currentBotUID) return;

        try {
            if (event.type === "message" || event.type === "message_reply") {
                await handleIncomingMessage(api, event);
            } else if (event.logMessageType === "log:subscribe") {
                await handleMemberJoin(api, event);
            }
        } catch (error) {
            // Không in nguyên lỗi transport vì có thể chứa cookie/header.
            console.warn(chalk.yellow(`[ EVENT ] Xử lý không hoàn tất; hàng đợi: ${antiBan.outboxHaltCode || "không dừng"}.`));
        }
    });

    // Định kỳ in Uptime
    setInterval(() => {
        const uptimeSec = process.uptime();
        const d = Math.floor(uptimeSec / 86400);
        const h = Math.floor((uptimeSec % 86400) / 3600);
        const m = Math.floor((uptimeSec % 3600) / 60);
        const s = Math.floor(uptimeSec % 60);
        const uptimeStr = `${d > 0 ? `${d}d ` : ""}${h}h ${m}m ${s}s`;
        const heapUsedMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

        console.log(
            chalk.gray(`[ ${getTimestamp()} ] `) +
            chalk.cyan(`[ UPTIME & ANTI-BAN ] `) +
            chalk.green(`Online: ${uptimeStr} `) +
            chalk.yellow(`| RAM: ${heapUsedMB} MB `) +
            chalk.magenta(`| Outbox Queue: ${antiBan.outboxQueue.length} `) +
            chalk.red(`| Muted Users: ${antiBan.blacklistedUsers.size}`)
        );
    }, 15 * 60 * 1000);
});

// 8. BỘ XỬ LÝ TIN NHẮN VÀ MOCK CONTEXT CHO CÁC LỆNH
async function handleIncomingMessage(api, event) {
    const rawBody = (event.body || "").trim();
    const senderID = String(event.senderID);
    const threadID = String(event.threadID);
    const messageID = String(event.messageID);
    const botUID = currentBotUID || String(api.getCurrentUserID());

    if (!rawBody) return;

    // Kiểm tra quyền Admin
    const isBotAdmin = isAdmin(senderID) || senderID === ADMIN_UID || (config.MESSENGER?.ADMINBOT || []).includes(senderID);

    // 1. KIỂM TRA RATE LIMIT CHỐNG SPAM USER
    const rateCheck = antiBan.checkUserRateLimit(senderID, isBotAdmin);
    if (!rateCheck.allowed) {
        if (rateCheck.action === "JUST_BLACKLISTED" || rateCheck.action === "COOLDOWN_WARNING") {
            await antiBan.safeSendMessage(api, rateCheck.reason, threadID, messageID);
        }
        return;
    }

    // 2. MOCK DISCORD CLIENT OBJECT
    const mockClient = {
        user: {
            id: botUID,
            tag: BOT_NAME,
            username: BOT_NAME,
            displayAvatarURL: () => `https://graph.facebook.com/${botUID}/picture?type=large`
        },
        ws: {
            ping: Math.floor(Math.random() * 25) + 15
        },
        guilds: {
            cache: {
                size: 1
            }
        },
        users: {
            cache: {
                size: 1
            },
            fetch: async (id) => ({
                id: String(id),
                tag: `FB_${id}`,
                username: `FB_${id}`,
                displayName: `User ${id}`,
                createdAt: new Date(),
                displayAvatarURL: () => `https://graph.facebook.com/${id}/picture?type=large`
            })
        },
        commands: commands
    };

    // 3. TẠO MESSAGE ADAPTER TƯƠNG THÍCH HOÀN TOÀN
    const msgAdapter = {
        id: messageID,
        messageID: messageID,
        threadID: threadID,
        guildId: threadID,
        senderID: senderID,
        content: rawBody,
        body: rawBody,
        client: mockClient,
        author: {
            id: senderID,
            username: senderID,
            tag: senderID,
            displayName: senderID === ADMIN_UID ? ADMIN_NAME : senderID,
            createdAt: new Date(),
            displayAvatarURL: () => `https://graph.facebook.com/${senderID}/picture?type=large`
        },
        member: {
            id: senderID,
            nickname: senderID === ADMIN_UID ? ADMIN_NAME : senderID,
            joinedAt: new Date(),
            roles: {
                cache: [],
                highest: { name: isBotAdmin ? "ADMIN BOT" : "Thành viên" }
            },
            permissions: {
                has: () => isBotAdmin
            }
        },
        guild: {
            id: threadID,
            name: "Messenger Box",
            members: {
                fetch: async (id) => ({
                    id: String(id),
                    user: { id: String(id), tag: String(id), displayAvatarURL: () => `https://graph.facebook.com/${id}/picture?type=large` },
                    roles: { cache: [], highest: { name: "Thành viên" } }
                })
            }
        },
        channel: {
            id: threadID,
            send: async (payload) => msgAdapter.reply(payload)
        },
        mentions: {
            users: {
                first: () => {
                    if (event.type === "message_reply" && event.messageReply?.senderID) {
                        const replyUID = String(event.messageReply.senderID);
                        return {
                            id: replyUID,
                            tag: replyUID,
                            username: replyUID,
                            displayName: replyUID,
                            createdAt: new Date(),
                            displayAvatarURL: () => `https://graph.facebook.com/${replyUID}/picture?type=large`
                        };
                    }
                    if (event.mentions && Object.keys(event.mentions).length > 0) {
                        const targetID = Object.keys(event.mentions)[0];
                        return {
                            id: targetID,
                            tag: event.mentions[targetID] || targetID,
                            username: event.mentions[targetID] || targetID,
                            displayName: event.mentions[targetID] || targetID,
                            createdAt: new Date(),
                            displayAvatarURL: () => `https://graph.facebook.com/${targetID}/picture?type=large`
                        };
                    }
                    return null;
                }
            }
        },
        reply: async (response) => {
            const payload = await formatMessagePayload(response);
            const sentInfo = await antiBan.safeSendMessage(api, payload, threadID, messageID);

            return {
                messageID: sentInfo?.messageID,
                threadID: threadID,
                edit: async (editPayload) => {
                    const formattedEdit = await formatMessagePayload(editPayload);
                    return await antiBan.safeSendMessage(api, formattedEdit, threadID);
                },
                editReply: async (editPayload) => {
                    const formattedEdit = await formatMessagePayload(editPayload);
                    return await antiBan.safeSendMessage(api, formattedEdit, threadID);
                },
                delete: async () => {
                    if (sentInfo?.messageID && typeof api.unsendMessage === "function") {
                        try { await api.unsendMessage(sentInfo.messageID); } catch(e){}
                    }
                }
            };
        }
    };

    // 4. XỬ LÝ KHI CHỈ GÕ PREFIX
    if (rawBody === PREFIX) {
        const uptimeSec = process.uptime();
        const h = Math.floor(uptimeSec / 3600);
        const m = Math.floor((uptimeSec % 3600) / 60);
        const s = Math.floor(uptimeSec % 60);
        const text = `👑 [ ${BOT_NAME} - MESSENGER VIP PRO ] 👑\n` +
                     `👤 Quản trị viên: ${ADMIN_NAME} (${ADMIN_UID})\n` +
                     `⏱️ Uptime: ${h}h ${m}m ${s}s\n` +
                     `⚡ Tiền tố hệ thống: [ ${PREFIX} ]\n` +
                     `🧠 AI Engine: Groq Cloud (Qwen 3.8 / GPT OSS 120B)\n` +
                     `🛡️ Hàng đợi có giới hạn tần suất; không bảo đảm tránh khóa tài khoản.\n` +
                     `👉 Gõ [ ${PREFIX}help ] để xem toàn bộ danh sách lệnh!`;
        return msgAdapter.reply(text);
    }

    // 5. NẾU KHÔNG CÓ PREFIX: TỰ ĐỘNG KẾT NỐI BOT AI & MỞ NHẠC YOUTUBE
    if (!rawBody.startsWith(PREFIX)) {
        const isReplyToBot = event.type === "message_reply" && String(event.messageReply?.senderID) === botUID;
        if (shouldTriggerBotAI(rawBody, isReplyToBot)) {
            console.log(chalk.gray(`[ ${getTimestamp()} ] `) + chalk.magenta(`[ BOT AI & MUSIC ] `) + chalk.white(`Xử lý tin nhắn: "${rawBody.slice(0, 50)}" từ UID: ${senderID}`));
            await handleMessengerAIChat(msgAdapter, rawBody, threadID, senderID, isBotAdmin);
        }
        return;
    }

    const args = rawBody.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    // 6. CÁC LỆNH TIỆN ÍCH MESSENGER TÍCH HỢP SẴN
    if (commandName === "antiban" || commandName === "ab") {
        const text = `🛡️ [ THÔNG TIN HÀNG ĐỢI VÀ GIỚI HẠN TẦN SUẤT ]\n\n` +
                     `👑 Quản trị viên: ${ADMIN_NAME} (${ADMIN_UID})\n` +
                     `✅ Trạng thái: ${antiBan.outboxHaltCode || "Đang hoạt động"}\n` +
                     `🤖 Mô phỏng người thật: Có (Đã xem + Soạn tin nhắn)\n` +
                     `⚡ Độ trễ gõ phím: ${antiBan.options.minTypingDelayMs}ms - ${antiBan.options.maxTypingDelayMs}ms (+/- ${antiBan.options.jitterMs}ms Jitter)\n` +
                     `⏱️ Cooldown mỗi user: ${(antiBan.options.userCooldownMs / 1000).toFixed(1)}s\n` +
                     `📦 Hàng đợi tin nhắn: ${antiBan.outboxQueue.length}/${antiBan.options.maxOutboxQueueSize} tin đang chờ\n` +
                     `🚫 Số người dùng đang bị tạm khóa (Mute): ${antiBan.blacklistedUsers.size} người\n` +
                     `💾 Lưu bản sao cookie: Mỗi ${Math.round(antiBan.options.autoSaveAppStateIntervalMs / 60000)} phút\n\n` +
                     `💡 Lưu cookie không gia hạn phiên. Bot không bảo đảm tránh checkpoint hoặc khóa tài khoản.`;
        return msgAdapter.reply(text);
    }

    if (commandName === "uid") {
        let targetUID = senderID;
        if (event.type === "message_reply" && event.messageReply?.senderID) {
            targetUID = String(event.messageReply.senderID);
        } else if (event.mentions && Object.keys(event.mentions).length > 0) {
            targetUID = Object.keys(event.mentions)[0];
        }
        return msgAdapter.reply(`🆔 Facebook UID của bạn hoặc người được chọn là:\n👉 ${targetUID}`);
    }

    if (commandName === "tid") {
        return msgAdapter.reply(`🆔 Thread ID của cuộc trò chuyện này là:\n👉 ${threadID}`);
    }

    if (commandName === "help" || commandName === "menu") {
        const categories = {};
        for (const [name, cmdObj] of commands.entries()) {
            const cat = cmdObj.category || "Tiện ích";
            if (!categories[cat]) categories[cat] = [];
            if (!categories[cat].includes(name)) {
                categories[cat].push(name);
            }
        }

        let helpText = `╔══════════ MENU LỆNH BOT ══════════╗\n`;
        helpText += `👑 Bot: ${BOT_NAME}\n`;
        helpText += `👤 Admin: ${ADMIN_NAME} (${ADMIN_UID})\n`;
        helpText += `⚡ Tiền tố: ${PREFIX}\n`;
        helpText += `🧠 AI Engine: Groq Cloud (Qwen 3.8 / GPT OSS 120B)\n`;
        helpText += `🛡️ Chế độ Chống Ban: VIP PRO Active\n`;
        helpText += `╠═══════════════════════════════════╣\n`;

        for (const [cat, list] of Object.entries(categories)) {
            helpText += `📂 [ ${cat.toUpperCase()} ]\n`;
            helpText += `👉 ${list.map(l => `${PREFIX}${l}`).join(" | ")}\n\n`;
        }

        helpText += `🤖 [ BOT AI & NHẠC YOUTUBE ]\n`;
        helpText += `• Chat AI: ${PREFIX}ai <câu hỏi> hoặc nhắn có từ "bot", "bot ơi"\n`;
        helpText += `• Tải nhạc: ${PREFIX}sing <tên bài> hoặc nhắn "bot mở nhạc <tên bài>"\n`;
        helpText += `• Tải video YouTube: ${PREFIX}ytb <từ khóa>\n\n`;

        helpText += `⚙️ [ TIỆN ÍCH MESSENGER ]\n`;
        helpText += `👉 ${PREFIX}antiban | ${PREFIX}uid | ${PREFIX}tid\n`;
        helpText += `╚═══════════════════════════════════╝\n`;
        helpText += `💡 Gõ ${PREFIX}<tên lệnh> để trải nghiệm!`;
        return msgAdapter.reply(helpText);
    }

    // 7. THỰC THI LỆNH TỪ SRC/COMMANDS
    const cmd = commands.get(commandName) || commands.get(aliases.get(commandName));
    if (!cmd) {
        return msgAdapter.reply(`❌ Lệnh [ ${PREFIX}${commandName} ] không tồn tại! Gõ [ ${PREFIX}help ] để xem danh sách lệnh.`);
    }

    // Kiểm tra quyền hạn lệnh
    const requiredLevel = cmd.permissions || 0;
    if (requiredLevel >= 3 && !isBotAdmin) {
        return msgAdapter.reply(`⛔ Lệnh này chỉ dành cho ADMIN BOT (${ADMIN_NAME})!`);
    }

    try {
        console.log(chalk.gray(`[ ${getTimestamp()} ] `) + chalk.cyan(`[ LỆNH ] `) + chalk.yellow(`${PREFIX}${commandName}`) + chalk.green(` từ UID: ${senderID}`));
        if (typeof cmd.executePrefix === "function") {
            await cmd.executePrefix(msgAdapter, args, { commands, api, client: mockClient });
        } else if (typeof cmd.execute === "function") {
            await cmd.execute(msgAdapter, args, { commands, api, client: mockClient });
        }
    } catch (err) {
        console.error(chalk.red(`[ LỖI THỰC THI LỆNH: ${commandName} ]`));
        if (antiBan.outboxHaltCode) return;
        await msgAdapter.reply(`❌ Không thể hoàn tất lệnh [ ${commandName} ].`)
            .catch(() => console.warn(chalk.yellow(`[ OUTBOX ] Không gửi được thông báo lỗi; không tự gửi lại.`)));
    }
}

// 9. XỬ LÝ CHÀO MỪNG THÀNH VIÊN MỚI
async function handleMemberJoin(api, event) {
    try {
        const threadID = String(event.threadID);
        const addedParticipants = event.logMessageData?.addedParticipants || [];
        const botUID = currentBotUID || String(api.getCurrentUserID());

        for (const user of addedParticipants) {
            if (String(user.userFbId) === botUID) {
                const welcomeBot = `🌸 Cảm ơn đã thêm ${BOT_NAME} vào nhóm!\n` +
                                   `👑 Quản trị viên: ${ADMIN_NAME}\n` +
                                   `⚡ Tiền tố lệnh là: [ ${PREFIX} ]\n` +
                                   `🧠 Bạn có thể gọi "bot ơi", "bot mở nhạc <tên bài>" hoặc gõ [ ${PREFIX}help ] để xem lệnh!\n` +
                                   `🛡️ Bot có hàng đợi và giới hạn tần suất để hạn chế gửi dồn tin nhắn.`;
                await antiBan.safeSendMessage(api, welcomeBot, threadID);
                return;
            }
        }

        const names = addedParticipants.map(u => u.fullName).join(", ");
        const welcomeText = `👋 Chào mừng bạn ${names} đã tham gia nhóm!\nChúc bạn có những giây phút trò chuyện vui vẻ tại đây! ✨`;
        await antiBan.safeSendMessage(api, welcomeText, threadID);
    } catch (e) {
        console.error("Lỗi xử lý member join:", e.message);
    }
}

// 10. BẢO VỆ CHỐNG CRASH HỆ THỐNG (CHẠY 24/7)
process.on("uncaughtException", (err) => {
    console.error(chalk.red(`[ UNCAUGHT EXCEPTION ]: `), err.message || err);
});

process.on("unhandledRejection", (reason) => {
    console.error(chalk.yellow(`[ UNHANDLED REJECTION ]: `), reason);
});
