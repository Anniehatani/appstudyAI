const chalk = require("chalk");
const moment = require("moment-timezone");
const { getAutoGreetingConfig } = require("./settings");

const greetingCooldowns = new Map();
const COOLDOWN_MS = 8000; // 8 giây giữa các lần tự động chào của 1 người

// Danh sách câu chào phong phú, thân thiện & ấm áp
const GREETING_REPLIES = [
    "👋 Chào {user}! Chúc bạn một ngày thật nhiều niềm vui và may mắn nha! ✨",
    "💖 Hello {user}! Rất vui được gặp bạn hôm nay, bạn có khỏe không nè? 😊",
    "🌸 Xin chào {user}! Annie chúc bạn có những giây phút thư giãn tuyệt vời tại server nhé! 🍀",
    "✨ Halu {user}! Hôm nay có chuyện gì vui không, kể cho Annie nghe với nào! 🥰",
    "👋 Hi {user}! Chúc bạn một ngày làm việc và học tập tràn đầy năng lượng nha! 🌟",
    "🎉 Chào {user}! Rất vui vì có bạn ở đây, chúc bạn luôn vui vẻ và hạnh phúc nhé! 🌷",
    "🍀 Hế lô {user}! Đừng quên mỉm cười và giữ gìn sức khỏe thật tốt nha! 💖",
    "☕ Chào {user}! Chúc bạn có một ngày mới tràn ngập điều ngọt ngào và tích cực! 🌤️"
];

// Danh sách các từ người nhận hoặc trợ từ được phép đi sau từ chào
const ALLOWED_SUFFIX_WORDS = new Set([
    "bot", "annie", "mọi", "người", "moi", "nguoi", "mn", "mng", "cả", "nhà", "ca", "nha",
    "all", "everyone", "team", "ae", "anh", "em", "cậu", "cau", "bạn", "ban",
    "ad", "admin", "bác", "bac", "chị", "chi", "group", "server",
    "ạ", "a", "nha", "nhé", "nhe", "nhó", "nho", "nghen", "nè", "ne", "ha", "nhen",
    "ơi", "oi", "yêu", "yeu", "nhá"
]);

/**
 * Làm sạch văn bản: bỏ icon, emoji, dấu câu thừa, chỉ giữ lại chữ cái Unicode
 */
function cleanGreetingText(content) {
    if (!content) return "";
    return content
        .toLowerCase()
        // Xóa emoji discord kiểu <:name:id> hoặc <a:name:id>
        .replace(/<a?:.+?:\d+>/g, "")
        // Chỉ giữ lại chữ cái Unicode (\p{L}) và khoảng trắng
        .replace(/[^\p{L}\s]/gu, " ")
        // Gom nhiều khoảng trắng thành 1 khoảng trắng
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Kiểm tra xem tin nhắn có phải lời chào hay không
 */
function isGreeting(content) {
    if (!content) return false;
    const trimmed = content.trim();

    // Bỏ qua nếu bắt đầu bằng tiền tố lệnh bot
    if (/^[!/.?#$]/.test(trimmed)) return false;

    const clean = cleanGreetingText(trimmed);
    if (!clean || clean.length > 35) return false;

    // 1. Kiểm tra các câu chúc cụ thể (buổi sáng, trưa, chiều, tối, good morning...)
    const specialPatterns = [
        /^(chúc|chuc|chào|chao)\s+(buổi|buoi)?\s*(sáng|trưa|chiều|tối|sang|trua|chieu|toi)(\s+(vui vẻ|ạ|nha|nhé|nè|bot|mn|cả nhà))?$/i,
        /^(good\s+(morning|afternoon|evening|night|day))(\s+(all|everyone|bot|mn|team))?$/i
    ];
    if (specialPatterns.some(p => p.test(clean))) {
        return true;
    }

    // 2. Tìm từ chào mở đầu
    const greetingPrefixRegex = /^(hi+|hello+|helo+|hey+|hai+|alo+|hola+|hế\s*lô|hê\s*lô|hé\s*nhô|hí+|chao\s*xìn|chào+|xin\s*chào+|chao+|xin\s*chao+)(\s+|$)/i;
    const match = clean.match(greetingPrefixRegex);
    if (!match) return false;

    // Lấy phần còn lại sau từ chào
    const remainder = clean.slice(match[0].length).trim();
    if (!remainder) return true; // Chỉ có "hi", "hello", "chào", "alo",...

    // Kiểm tra các từ trong phần còn lại
    const words = remainder.split(/\s+/);
    if (words.length > 4) return false; // Không quá 4 từ đi kèm

    return words.every(word => ALLOWED_SUFFIX_WORDS.has(word));
}

/**
 * Xử lý tự động chào lại thành viên
 */
async function handleAutoGreeting(message) {
    if (!message || message.author?.bot) return false;
    if (!message.guild) return false;

    // Kiểm tra cấu hình xem server có bật auto greeting không
    const isAutoGreetEnabled = getAutoGreetingConfig(message.guild.id);
    if (!isAutoGreetEnabled) return false;

    // Kiểm tra nội dung tin nhắn có phải lời chào không
    if (!isGreeting(message.content)) return false;

    // Kiểm tra Cooldown của người dùng để tránh spam
    const userId = message.author.id;
    const now = Date.now();
    if (greetingCooldowns.has(userId)) {
        const lastGreet = greetingCooldowns.get(userId);
        if (now - lastGreet < COOLDOWN_MS) {
            return false; // Đang trong cooldown thì bỏ qua
        }
    }
    greetingCooldowns.set(userId, now);
    setTimeout(() => {
        if (greetingCooldowns.get(userId) === now) {
            greetingCooldowns.delete(userId);
        }
    }, COOLDOWN_MS);

    // Chọn ngẫu nhiên câu chào
    const randomTemplate = GREETING_REPLIES[Math.floor(Math.random() * GREETING_REPLIES.length)];
    const replyText = randomTemplate.replace(/{user}/g, `${message.author}`);

    try {
        await message.reply({
            content: replyText,
            allowedMentions: { repliedUser: true }
        });

        const guildName = message.guild.name;
        const userTag = message.author.tag || message.author.username;
        const time = moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");

        console.log(
            chalk.gray(`[ ${time} ] `) +
            chalk.green(`[ AUTO CHÀO ] `) +
            chalk.cyan(`[${guildName} | ${userTag}] `) +
            chalk.white(`Đã chào lại thành viên ("${message.content.trim()}")`)
        );
        return true;
    } catch (err) {
        console.error(chalk.red("[ LỖI AUTO CHÀO ]"), err.message);
        return false;
    }
}

module.exports = {
    isGreeting,
    handleAutoGreeting,
    GREETING_REPLIES
};
