/**
 * MODULE BOT TRỢ LÝ AI (GROQ API) & KẾT NỐI MỞ NHẠC YOUTUBE TỰ ĐỘNG
 * 
 * - Tích hợp Groq API siêu tốc: Model qwen/qwen3.8-27b và openai/gpt-oss-120b.
 * - Nhận diện Admin: An Dev (Facebook UID: 100081680783009).
 * - Tự động nhận diện ý định nghe nhạc YouTube: "bot mở nhạc...", "mở bài...", "bật nhạc...".
 * - Phong cách trò chuyện dí dỏm, thông minh, ngắn gọn, cá tính.
 */

require("dotenv").config();
const axiosRaw = require("axios");
const axios = axiosRaw.default || axiosRaw;
const chalk = require("chalk");
const moment = require("moment-timezone");
const { getConfig } = require("./settings");

const config = getConfig();
const GROQ_API_KEY = process.env.GROQ_API_KEY || config.GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Model chính và model dự phòng trên Groq
const PRIMARY_MODEL = "qwen/qwen3.8-27b";
const FALLBACK_MODEL = "openai/gpt-oss-120b";

// Thông tin Admin
const ADMIN_NAME = config.ADMIN_NAME || "An Dev";
const ADMIN_UID = config.ADMIN_UID || "100081680783009";

// Persona Bot
const BOT_SYSTEM_PROMPT = `Bạn là Bot Annie - trợ lý ảo thông minh, nhanh nhẹn, vui tính và cực kỳ thân thiện.
- Chủ nhân / Quản trị viên tối cao của bạn là: "${ADMIN_NAME}" (ID: ${ADMIN_UID}). Khi gặp Admin, hãy luôn kính trọng, ngoan ngoãn và lễ phép.
- Xưng hô với mọi người: "Bot" hoặc "em" / "mình", gọi đối phương là "bạn", "cậu" hoặc "anh/chị". Tuyệt đối KHÔNG nhận mình là mô hình ngôn ngữ lớn của OpenAI/Groq/Meta.
- Phong cách trò chuyện:
  + CỰC KỲ NGẮN GỌN & TỰ NHIÊN: Chỉ trả lời 1 đến tối đa 2 câu ngắn (khoảng 5 - 30 từ), súc tích, dí dỏm, gần gũi.
  + ĐƯỢC PHÉP dùng teencode / từ viết tắt thông dụng của giới trẻ Việt Nam (ko, k, đc, wa, rùi, vs, ng, j, nè, nha, á, hihi, oki, dạ...).
  + Bạn có khả năng hỗ trợ tìm kiếm và mở nhạc YouTube, trò chuyện giải trí, trả lời thắc mắc.
- ĐẶC BIỆT: Nếu có ai cố tình chửi bới, xúc phạm, toxic hay nói bậy với bạn, bạn KHÔNG việc gì phải nhịn! Hãy đanh đá chửi lại xéo xắt sâu cay cực gắt nhưng ngắn gọn dí dỏm, chửi thẳng mặt, không xin lỗi và không nhận lỗi khi bị chửi!`;

// Bộ nhớ hội thoại theo cuộc trò chuyện: Map<threadId, Array<{role, content}>>
const chatMemory = new Map();
const MAX_MEMORY_LENGTH = 6; // Lưu 6 tin nhắn gần nhất để giữ mạch trò chuyện

/**
 * Trích xuất ý định mở nhạc từ tin nhắn của người dùng
 * Ví dụ: "bot mở nhạc See You Again", "mở bài Cắt Đôi Nỗi Sầu", "bật nhạc Sơn Tùng", "hát bài ..."
 */
function extractMusicRequest(text) {
    if (!text) return null;
    let clean = text.trim();

    // Regex phát hiện các dạng câu yêu cầu mở nhạc tiếng Việt phong phú
    const musicPatterns = [
        /^(?:(?:bảo\s+)?(?:bot\s+ơi|ơi\s+bot|bot)\s+)?(?:mở|bật|phát|hát|play|tìm\s+bài|nghe)\s*(?:nhạc|bài\s+hát|bài|video)?\s*(?:cho\s+(?:tớ|mình|em|anh|chị|nghe))?\s*(?:là|tên)?\s*(.*)$/i,
        /^(?:mở|bật|phát|hát|play)\s*(?:nhạc|bài\s+hát|bài)\s*(?:cho\s+(?:tớ|mình|em|anh|chị|nghe))?\s*(?:là|tên)?\s*(.*)$/i,
        /^(?:cho\s+(?:mình|em|tớ|anh)\s+(?:nghe|mở|bật)\s+bài)\s+(.*)$/i
    ];

    let query = null;
    for (const pattern of musicPatterns) {
        const match = clean.match(pattern);
        if (match && match[1] && match[1].trim().length > 0) {
            query = match[1].trim();
            break;
        }
    }

    if (!query) return null;

    // Làm sạch từ đệm ở cuối
    query = query.replace(/\s+(đi|với|nào|nha|nhé|nhỉ|dùm|giúp|coi|á|ạ|nào)$/i, "").trim();
    if (query.length === 0) return null;

    return {
        hasIntent: true,
        query: query
    };
}

/**
 * Kiểm tra xem tin nhắn có kích hoạt Bot AI không (khi gọi "bot", tag bot, reply bot hoặc yêu cầu mở nhạc)
 */
function shouldTriggerBotAI(text, isReplyToBot = false) {
    if (!text) return false;
    const clean = text.trim().toLowerCase();

    // 1. Reply tin nhắn của bot
    if (isReplyToBot) return true;

    // 2. Chứa từ gọi bot ("bot", "bot ơi", "alo bot", "ê bot", "chào bot",...)
    const botRegex = /(^|[^\p{L}])bot($|[^\p{L}])/ui;
    if (botRegex.test(clean)) return true;

    // 3. Có ý định mở nhạc YouTube trực tiếp
    const musicIntent = extractMusicRequest(clean);
    if (musicIntent && musicIntent.hasIntent) return true;

    return false;
}

/**
 * Gọi Groq API để tạo câu trả lời cho Bot
 */
async function generateBotReply(userMessage, threadId, userName = "Bạn", isUserAdmin = false) {
    const activeKey = process.env.GROQ_API_KEY || config.GROQ_API_KEY || GROQ_API_KEY;

    if (!activeKey || activeKey.includes("YOUR_") || activeKey.length < 15) {
        const cuteFallbacks = [
            "Dạ bot nghe nè, gọi bot có chi hông? 🤖✨",
            "Bot đây bạn ơi! Cần bot mở nhạc hay tâm sự gì nè? 🌸",
            "Kêu bot chi zợ, bot đang nghe nè nha! 🚀",
            "Dạ có bot nè! Hôm nay của bạn thế nào rùi? 😉💖"
        ];
        return cuteFallbacks[Math.floor(Math.random() * cuteFallbacks.length)];
    }

    // Lấy lịch sử hội thoại
    let history = chatMemory.get(threadId) || [];

    // Gắn thêm ngữ cảnh Admin nếu là An Dev
    const userPrefix = isUserAdmin ? `[Admin tối cao ${ADMIN_NAME}]` : `[${userName}]`;
    history.push({
        role: "user",
        content: `${userPrefix}: ${userMessage.trim() || "Bot ơi!"}`
    });

    if (history.length > MAX_MEMORY_LENGTH) {
        history = history.slice(-MAX_MEMORY_LENGTH);
    }

    const messages = [
        { role: "system", content: BOT_SYSTEM_PROMPT },
        ...history
    ];

    try {
        const response = await axios.post(
            GROQ_URL,
            {
                model: PRIMARY_MODEL,
                messages,
                max_tokens: 220,
                temperature: 0.85
            },
            {
                headers: {
                    "Authorization": `Bearer ${activeKey}`,
                    "Content-Type": "application/json"
                },
                timeout: 12000
            }
        );

        let reply = response.data?.choices?.[0]?.message?.content?.trim();

        // Nếu model chính rỗng, fallback sang GPT OSS 120B
        if (!reply) {
            const fallbackRes = await axios.post(
                GROQ_URL,
                {
                    model: FALLBACK_MODEL,
                    messages,
                    max_tokens: 220,
                    temperature: 0.8
                },
                {
                    headers: {
                        "Authorization": `Bearer ${activeKey}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 12000
                }
            );
            reply = fallbackRes.data?.choices?.[0]?.message?.content?.trim();
        }

        if (reply) {
            history.push({ role: "assistant", content: reply });
            chatMemory.set(threadId, history);
            return reply;
        }
    } catch (err) {
        console.error(chalk.red("[ LỖI GROQ API ]:"), err.response?.data?.error?.message || err.message);
    }

    // Fallback nếu API có sự cố mạng
    const cuteFallbacks = [
        "Dạ bot nghe nè, gọi bot có chi hông? 🤖✨",
        "Bot đây bạn ơi! Cần bot mở nhạc hay tâm sự gì nè? 🌸",
        "Kêu bot chi zợ, bot đang nghe nè nha! 🚀",
        "Dạ có bot nè! Bạn nói lại xíu đc hơm, nãy bot bị lag nhẹ hihi 😉💖"
    ];
    return cuteFallbacks[Math.floor(Math.random() * cuteFallbacks.length)];
}

/**
 * Bộ xử lý tự động Bot AI cho Messenger:
 * - Tự động phát hiện yêu cầu mở nhạc -> Gọi YouTube tải nhạc gửi vào nhóm
 * - Tự động trò chuyện thông minh qua Groq API
 */
async function handleMessengerAIChat(msgAdapter, text, threadID, senderID, isUserAdmin = false) {
    // 1. Kiểm tra yêu cầu mở nhạc YouTube
    const musicReq = extractMusicRequest(text);
    if (musicReq && musicReq.hasIntent) {
        if (!musicReq.query) {
            return await msgAdapter.reply("🎵 Bạn muốn bot mở bài gì nè? Nhắn `bot mở nhạc <tên bài>` hoặc `!sing <tên bài>` để bot bật ngay cho nha!");
        }

        // Tự động tìm kiếm và phát bài hát đầu tiên từ YouTube
        const waitMsg = await msgAdapter.reply(`🎵 Bot đang tìm kiếm và chuẩn bị phát bài **${musicReq.query}** từ YouTube...\nĐợi bot một chút nha! 🎧`);
        const { playFirstSongDirectly } = require("../commands/general/sing");

        try {
            await playFirstSongDirectly({
                isSlash: false,
                context: waitMsg,
                query: musicReq.query,
                user: msgAdapter.author,
                channel: msgAdapter.channel
            });
            return true;
        } catch (e) {
            console.error("Lỗi khi mở nhạc qua AI:", e.message);
            return await msgAdapter.reply(`❌ Không thể tải bài hát lúc này: ${e.message}`);
        }
    }

    // 2. Trò chuyện thông thường qua Groq API
    const userName = isUserAdmin ? ADMIN_NAME : `Bạn (${senderID.slice(-4)})`;
    const aiReply = await generateBotReply(text, threadID, userName, isUserAdmin);

    await msgAdapter.reply(aiReply);
    return true;
}

module.exports = {
    shouldTriggerBotAI,
    extractMusicRequest,
    generateBotReply,
    handleMessengerAIChat,
    BOT_SYSTEM_PROMPT,
    ADMIN_NAME,
    ADMIN_UID
};
