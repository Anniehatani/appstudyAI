const fs = require("fs-extra");
const path = require("path");
const { SlashCommandBuilder } = require("discord.js");
const { getPrefix } = require("../../utils/settings");

// Cấu hình chủ đề video mặc định (VD: "ff", "anime", "gai", "sad", "trai", hoặc "all" để lấy tất cả)
const DEFAULT_CATEGORY = "ff";

// Tải video theo chủ đề (hoặc lấy tất cả nếu category = "all")
function getRandomVideo(category = DEFAULT_CATEGORY) {
    try {
        const mediaDir = path.join(__dirname, "../../../data/media");

        // 1. Nếu chỉ định cụ thể 1 chủ đề (ví dụ: "ff", "anime", "gai", "sad", "trai")
        if (category && category.toLowerCase() !== "all") {
            const cleanName = category.toLowerCase().replace(".json", "");
            const specificFile = path.join(mediaDir, `${cleanName}.json`);

            if (fs.existsSync(specificFile)) {
                const list = fs.readJsonSync(specificFile);
                if (Array.isArray(list) && list.length > 0) {
                    return {
                        url: list[Math.floor(Math.random() * list.length)],
                        category: cleanName
                    };
                }
            }
        }

        // 2. Mặc định / hoặc khi category = "all": gom từ tất cả các file .json trong thư mục data/media
        if (fs.existsSync(mediaDir)) {
            const files = fs.readdirSync(mediaDir).filter(f => f.endsWith(".json"));
            const videos = [];
            for (const file of files) {
                try {
                    const list = fs.readJsonSync(path.join(mediaDir, file));
                    if (Array.isArray(list)) videos.push(...list);
                } catch (e) {}
            }
            if (videos.length > 0) {
                return {
                    url: videos[Math.floor(Math.random() * videos.length)],
                    category: "all"
                };
            }
        }
    } catch (e) {
        console.error("Lỗi khi tải video:", e.message);
    }
    return null;
}

// Format thời gian bot on
function formatUptime(uptimeSeconds) {
    const h = Math.floor(uptimeSeconds / 3600);
    const m = Math.floor((uptimeSeconds % 3600) / 60);
    const s = Math.floor(uptimeSeconds % 60);
    return `${h}h ${m}m ${s}s`;
}

// Xử lý khi chỉ gõ mình prefix (mặc định gửi video ff)
async function handlePrefixOnly(message, prefix, category = DEFAULT_CATEGORY) {
    const currentPrefix = prefix || getPrefix(message.guildId);
    const uptimeStr = formatUptime(process.uptime());
    const videoData = getRandomVideo(category);

    const payload = {
        content: `⏱️ **Uptime:** ${uptimeStr}\n⚜️ Cậu chưa nhập lệnh! Gõ \`${currentPrefix}help\` để xem lệnh.`
    };

    if (videoData && videoData.url) {
        payload.files = [{ attachment: videoData.url, name: "video.mp4" }];
    }

    try {
        await message.reply(payload);
    } catch (e) {
        console.error("Lỗi gửi phản hồi prefix:", e.message);
    }
}

// Xử lý khi gõ 2 lần prefix hoặc nhập sai lệnh
async function handleWrongCommand(message, { cmdName, prefix, isDoublePrefix }) {
    const currentPrefix = prefix || getPrefix(message.guildId);
    let text = "";

    if (isDoublePrefix) {
        text = `⚠️ Bạn đã nhập 2 lần prefix! (VD: \`${currentPrefix}help\`)`;
    } else {
        text = `❌ Lệnh \`${currentPrefix}${cmdName}\` không tồn tại! Gõ \`${currentPrefix}help\` để xem lệnh.`;
    }

    try {
        await message.reply({ content: text });
    } catch (e) {
        console.error("Lỗi gửi thông báo sai lệnh:", e.message);
    }
}

module.exports = {
    name: "sailenh",
    description: "Gửi thời gian bot online kèm video theo chủ đề",
    category: "Tiện ích",
    aliases: ["uptvid", "vd"],
    cooldown: 3,
    permissions: 0,
    data: new SlashCommandBuilder()
        .setName("sailenh")
        .setDescription("Gửi thời gian bot online kèm video theo chủ đề")
        .addStringOption(opt =>
            opt.setName("category")
                .setDescription("Chủ đề video (ff, anime, gai, sad, trai, all)")
                .setRequired(false)
        ),

    async executeSlash(interaction) {
        const prefix = getPrefix(interaction.guildId);
        const category = interaction.options.getString("category") || DEFAULT_CATEGORY;
        const uptimeStr = formatUptime(process.uptime());
        const videoData = getRandomVideo(category);

        const payload = {
            content: `⏱️ **Uptime:** ${uptimeStr}\n⚜️ Bot đang hoạt động! Gõ \`${prefix}help\` để xem lệnh.`
        };

        if (videoData && videoData.url) {
            payload.files = [{ attachment: videoData.url, name: "video.mp4" }];
        }

        await interaction.reply(payload);
    },

    async executePrefix(message, args) {
        const category = args?.[0] || DEFAULT_CATEGORY;
        await handlePrefixOnly(message, getPrefix(message.guildId), category);
    },

    DEFAULT_CATEGORY,
    handlePrefixOnly,
    handleWrongCommand,
    getRandomVideo,
    formatUptime
};
