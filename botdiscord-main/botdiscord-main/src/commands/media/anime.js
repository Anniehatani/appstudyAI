const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs-extra");
const path = require("path");

const dataPath = path.join(__dirname, "../../../data/media/anime.json");

function getRandomVideo() {
    try {
        if (fs.existsSync(dataPath)) {
            const list = fs.readJsonSync(dataPath);
            if (Array.isArray(list) && list.length > 0) {
                return list[Math.floor(Math.random() * list.length)];
            }
        }
    } catch (e) {
        console.error("Lỗi đọc file anime.json:", e);
    }
    return null;
}

module.exports = {
    name: "anime",
    description: "Gửi video Anime ngẫu nhiên",
    category: "Phương tiện",
    aliases: ["vdanime", "wibu"],
    cooldown: 3,
    permissions: 0,
    noPrefix: true,
    data: new SlashCommandBuilder()
        .setName("anime")
        .setDescription("Gửi video Anime ngẫu nhiên"),

    async executeSlash(interaction) {
        const videoUrl = getRandomVideo();
        if (!videoUrl) {
            return interaction.reply({ content: "❌ Không thể tải video Anime lúc này!", ephemeral: true });
        }
        await interaction.reply({
            content: `🌸 **Video Anime dành cho bạn:**`,
            files: [{ attachment: videoUrl, name: "anime.mp4" }]
        });
    },

    async executePrefix(message) {
        const videoUrl = getRandomVideo();
        if (!videoUrl) {
            return message.reply("❌ Không thể tải video Anime lúc này!");
        }
        await message.reply({
            content: `🌸 **Video Anime dành cho bạn:**`,
            files: [{ attachment: videoUrl, name: "anime.mp4" }]
        });
    }
};
