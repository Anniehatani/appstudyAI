const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs-extra");
const path = require("path");

const dataPath = path.join(__dirname, "../../../data/media/trai.json");

function getRandomVideo() {
    try {
        if (fs.existsSync(dataPath)) {
            const list = fs.readJsonSync(dataPath);
            if (Array.isArray(list) && list.length > 0) {
                return list[Math.floor(Math.random() * list.length)];
            }
        }
    } catch (e) {
        console.error("Lỗi đọc file trai.json:", e);
    }
    return null;
}

module.exports = {
    name: "trai",
    description: "Gửi video trai đẹp ngẫu nhiên",
    category: "Phương tiện",
    aliases: ["boy", "vdtrai", "traidep"],
    cooldown: 3,
    permissions: 0,
    noPrefix: true,
    data: new SlashCommandBuilder()
        .setName("trai")
        .setDescription("Gửi video trai đẹp ngẫu nhiên"),

    async executeSlash(interaction) {
        const videoUrl = getRandomVideo();
        if (!videoUrl) {
            return interaction.reply({ content: "❌ Không thể tải video trai đẹp lúc này!", ephemeral: true });
        }
        await interaction.reply({
            content: `✨ **Video trai đẹp:**`,
            files: [{ attachment: videoUrl, name: "trai.mp4" }]
        });
    },

    async executePrefix(message) {
        const videoUrl = getRandomVideo();
        if (!videoUrl) {
            return message.reply("❌ Không thể tải video trai đẹp lúc này!");
        }
        await message.reply({
            content: `✨ **Video trai đẹp:**`,
            files: [{ attachment: videoUrl, name: "trai.mp4" }]
        });
    }
};
