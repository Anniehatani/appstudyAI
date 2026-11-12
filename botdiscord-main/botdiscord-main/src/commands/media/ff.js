const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs-extra");
const path = require("path");

const dataPath = path.join(__dirname, "../../../data/media/ff.json");

function getRandomVideo() {
    try {
        if (fs.existsSync(dataPath)) {
            const list = fs.readJsonSync(dataPath);
            if (Array.isArray(list) && list.length > 0) {
                return list[Math.floor(Math.random() * list.length)];
            }
        }
    } catch (e) {
        console.error("Lỗi đọc file ff.json:", e);
    }
    return null;
}

module.exports = {
    name: "ff",
    description: "Gửi video Free Fire ngẫu nhiên từ kho lưu trữ",
    category: "Phương tiện",
    aliases: ["freefire", "vdff"],
    cooldown: 3,
    permissions: 0,
    noPrefix: true,
    data: new SlashCommandBuilder()
        .setName("ff")
        .setDescription("Gửi video Free Fire ngẫu nhiên"),

    async executeSlash(interaction) {
        const videoUrl = getRandomVideo();
        if (!videoUrl) {
            return interaction.reply({ content: "❌ Không thể tải video Free Fire lúc này!", ephemeral: true });
        }
        await interaction.reply({
            content: `🔥 **Video Free Fire ngẫu nhiên:**`,
            files: [{ attachment: videoUrl, name: "freefire.mp4" }]
        });
    },

    async executePrefix(message) {
        const videoUrl = getRandomVideo();
        if (!videoUrl) {
            return message.reply("❌ Không thể tải video Free Fire lúc này!");
        }
        await message.reply({
            content: `🔥 **Video Free Fire ngẫu nhiên:**`,
            files: [{ attachment: videoUrl, name: "freefire.mp4" }]
        });
    }
};
