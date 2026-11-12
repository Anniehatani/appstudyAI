const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs-extra");
const path = require("path");

const dataPath = path.join(__dirname, "../../../data/media/sad.json");

function getRandomVideo() {
    try {
        if (fs.existsSync(dataPath)) {
            const list = fs.readJsonSync(dataPath);
            if (Array.isArray(list) && list.length > 0) {
                return list[Math.floor(Math.random() * list.length)];
            }
        }
    } catch (e) {
        console.error("Lỗi đọc file sad.json:", e);
    }
    return null;
}

module.exports = {
    name: "sad",
    description: "Gửi video tâm trạng / buồn ngẫu nhiên",
    category: "Phương tiện",
    aliases: ["mood", "tamtrang", "vdsad"],
    cooldown: 3,
    permissions: 0,
    noPrefix: true,
    data: new SlashCommandBuilder()
        .setName("sad")
        .setDescription("Gửi video tâm trạng / buồn ngẫu nhiên"),

    async executeSlash(interaction) {
        const videoUrl = getRandomVideo();
        if (!videoUrl) {
            return interaction.reply({ content: "❌ Không thể tải video tâm trạng lúc này!", ephemeral: true });
        }
        await interaction.reply({
            content: `🌧️ **Video tâm trạng:**`,
            files: [{ attachment: videoUrl, name: "sad.mp4" }]
        });
    },

    async executePrefix(message) {
        const videoUrl = getRandomVideo();
        if (!videoUrl) {
            return message.reply("❌ Không thể tải video tâm trạng lúc này!");
        }
        await message.reply({
            content: `🌧️ **Video tâm trạng:**`,
            files: [{ attachment: videoUrl, name: "sad.mp4" }]
        });
    }
};
