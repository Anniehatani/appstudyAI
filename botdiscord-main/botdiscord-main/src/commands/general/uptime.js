const { SlashCommandBuilder, EmbedBuilder, version: djsVersion } = require("discord.js");
const os = require("os");
const moment = require("moment-timezone");

function formatUptime(uptimeSeconds) {
    const d = Math.floor(uptimeSeconds / (24 * 3600));
    const h = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
    const m = Math.floor((uptimeSeconds % 3600) / 60);
    const s = Math.floor(uptimeSeconds % 60);
    const parts = [];
    if (d > 0) parts.push(`${d} ngày`);
    if (h > 0) parts.push(`${h} giờ`);
    if (m > 0) parts.push(`${m} phút`);
    parts.push(`${s} giây`);
    return parts.join(" ");
}

function buildUptimeEmbed(client) {
    const uptimeStr = formatUptime(process.uptime());
    const mem = process.memoryUsage();
    const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
    const rssMB = (mem.rss / 1024 / 1024).toFixed(2);
    const totalMemGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMemGB = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);

    const currentTime = moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

    return new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("⚙️ THÔNG TIN TRẠNG THÁI HỆ THỐNG")
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
            { name: "⏱️ Thời gian hoạt động", value: `\`\`\`${uptimeStr}\`\`\``, inline: false },
            { name: "💾 Bộ nhớ RAM", value: `Heap: \`${heapUsedMB} MB\`\nRSS: \`${rssMB} MB\`\nHệ thống: \`${freeMemGB}/${totalMemGB} GB trống\``, inline: true },
            { name: "💻 Nền tảng", value: `OS: \`${os.type()} (${os.arch()})\`\nNode.js: \`${process.version}\`\nDiscord.js: \`v${djsVersion}\``, inline: true },
            { name: "🌐 Thống kê", value: `Máy chủ: \`${client.guilds.cache.size}\`\nNgười dùng: \`${client.users.cache.size}\`\nĐộ trễ: \`${client.ws.ping}ms\``, inline: true }
        )
        .setFooter({ text: `Giờ Việt Nam: ${currentTime}` })
        .setTimestamp();
}

module.exports = {
    name: "uptime",
    description: "Xem thời gian hoạt động và trạng thái hệ thống bot",
    category: "Hệ thống",
    aliases: ["upt"],
    cooldown: 5,
    permissions: 0,
    data: new SlashCommandBuilder()
        .setName("uptime")
        .setDescription("Xem thời gian hoạt động và trạng thái hệ thống bot"),

    async executeSlash(interaction, { client }) {
        const embed = buildUptimeEmbed(client);
        await interaction.reply({ embeds: [embed] });
    },

    async executePrefix(message, args, { client }) {
        const embed = buildUptimeEmbed(client);
        await message.reply({ embeds: [embed] });
    }
};
