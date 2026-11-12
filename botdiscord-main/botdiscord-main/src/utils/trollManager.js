const fs = require("fs-extra");
const path = require("path");

const trollFilePath = path.join(__dirname, "../../data/troll.json");

function loadTrollData() {
    try {
        if (fs.existsSync(trollFilePath)) {
            return fs.readJsonSync(trollFilePath);
        }
    } catch (e) {
        console.error("Lỗi đọc troll.json:", e);
    }
    return {};
}

function saveTrollData(data) {
    try {
        fs.ensureDirSync(path.dirname(trollFilePath));
        fs.writeJsonSync(trollFilePath, data, { spaces: 2 });
    } catch (e) {
        console.error("Lỗi lưu troll.json:", e);
    }
}

/**
 * Đặt icon troll cho một user trong server
 */
function setTroll(guildId, userId, emoji) {
    const data = loadTrollData();
    if (!data[guildId]) data[guildId] = {};
    data[guildId][userId] = emoji;
    saveTrollData(data);
    return true;
}

/**
 * Gỡ troll cho một user
 */
function removeTroll(guildId, userId) {
    const data = loadTrollData();
    if (data[guildId] && data[guildId][userId]) {
        delete data[guildId][userId];
        if (Object.keys(data[guildId]).length === 0) {
            delete data[guildId];
        }
        saveTrollData(data);
        return true;
    }
    return false;
}

/**
 * Lấy icon troll của user (nếu có)
 */
function getTroll(guildId, userId) {
    const data = loadTrollData();
    return data[guildId]?.[userId] || null;
}

/**
 * Danh sách người đang bị troll trong server
 */
function listTrolls(guildId) {
    const data = loadTrollData();
    return data[guildId] || {};
}

/**
 * Xóa hết danh sách troll trong server
 */
function clearTrolls(guildId) {
    const data = loadTrollData();
    if (data[guildId]) {
        delete data[guildId];
        saveTrollData(data);
        return true;
    }
    return false;
}

/**
 * Tự động thả cảm xúc vào tin nhắn của người bị troll
 */
async function handleTrollReaction(message) {
    if (!message.guild || message.author.bot) return;

    const emoji = getTroll(message.guild.id, message.author.id);
    if (!emoji) return;

    try {
        // Kiểm tra xem là custom emoji hay unicode
        const customMatch = emoji.match(/<a?:(\w+):(\d+)>/);
        if (customMatch) {
            await message.react(customMatch[2]);
        } else {
            await message.react(emoji);
        }
        console.log(`[ TROLL ] Đã thả icon ${emoji} vào tin nhắn của ${message.author.tag || message.author.username}`);
    } catch (err) {
        console.error(`[ LỖI TROLL ] Không thể thả icon ${emoji}:`, err.message);
    }
}

module.exports = {
    setTroll,
    removeTroll,
    getTroll,
    listTrolls,
    clearTrolls,
    handleTrollReaction
};
