const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs-extra");
const path = require("path");

const dataPath = path.join(__dirname, "../../../data/media/gai.json");

function getRandomVideo() {
    try {
        if (fs.existsSync(dataPath)) {
            const list = fs.readJsonSync(dataPath);
            if (Array.isArray(list) && list.length > 0) {
                return list[Math.floor(Math.random() * list.length)];
            }
        }
    } catch (e) {
        console.error("Lỗi đọc file gai.json:", e);
    }
    return null;
}

module.exports = {
    name: "gai",
    description: "Gửi video gái xinh ngẫu nhiên",
    category: "Phương tiện",
    aliases: ["gái", "girl", "vdgai", "vdgái"],
    cooldown: 3,
    permissions: 0,
    noPrefix: true,
    data: new SlashCommandBuilder()
        .setName("gai")
        .setDescription("Gửi video gái xinh ngẫu nhiên"),

    async executeSlash(interaction) {
        const videoUrl = getRandomVideo();
        if (!videoUrl) {
            return interaction.reply({ content: "❌ Không thể tải video gái xinh lúc này!", ephemeral: true });
        }
        await interaction.reply({
            content: `🌸 **Video gái xinh dành cho bạn:**`,
            files: [{ attachment: videoUrl, name: "gai.mp4" }]
        });
    },

    async executePrefix(message) {
        const videoUrl = getRandomVideo();
        if (!videoUrl) {
            return message.reply("❌ Không thể tải video gái xinh lúc này!");
        }
        await message.reply({
            content: `🌸 **Video gái xinh dành cho bạn:**`,
            files: [{ attachment: videoUrl, name: "gai.mp4" }]
        });
    }
};
