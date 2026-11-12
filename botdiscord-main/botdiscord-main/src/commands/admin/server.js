const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { isAdmin } = require("../../utils/settings");

module.exports = {
    name: "server",
    description: "Xem danh sách các máy chủ bot đang tham gia và điều khiển out server từ xa",
    category: "Quản trị",
    aliases: ["sever", "guilds"],
    cooldown: 3,
    permissions: 3, // Chỉ ADMIN BOT mới có quyền
    data: new SlashCommandBuilder()
        .setName("server")
        .setDescription("Quản lý máy chủ bot tham gia và điều khiển out server")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName("list")
                .setDescription("Xem danh sách tất cả các server bot đang ở")
        )
        .addSubcommand(sub =>
            sub.setName("out")
                .setDescription("Lệnh cho bot rời khỏi (out) một máy chủ")
                .addStringOption(opt =>
                    opt.setName("target")
                        .setDescription("ID máy chủ hoặc Số thứ tự trong danh sách")
                        .setRequired(true)
                )
        ),

    async executeSlash(interaction, { client }) {
        const authorId = interaction.user.id;
        if (!isAdmin(authorId)) {
            return interaction.reply({
                content: "⛔ Chỉ **ADMIN BOT** mới có quyền sử dụng lệnh quản lý server này!",
                ephemeral: true
            });
        }

        const sub = interaction.options.getSubcommand();

        if (sub === "list") {
            const embed = buildServerListEmbed(client);
            return interaction.reply({ embeds: [embed] });
        }

        if (sub === "out") {
            const query = interaction.options.getString("target").trim();
            const result = await handleLeaveServer(client, query);
            return interaction.reply({ content: result.message, ephemeral: !result.success });
        }
    },

    async executePrefix(message, args, { client }) {
        const authorId = message.author.id;
        if (!isAdmin(authorId)) {
            return message.reply("⛔ Chỉ **ADMIN BOT** mới có quyền sử dụng lệnh quản lý server này!");
        }

        const action = args[0]?.toLowerCase();

        // Xem danh sách khi không có tham số hoặc gõ list
        if (!action || action === "list") {
            const embed = buildServerListEmbed(client);
            return message.reply({ embeds: [embed] });
        }

        // Lệnh out server: !server out <id/stt>
        if (action === "out" || action === "leave") {
            const query = args[1]?.trim();
            if (!query) {
                return message.reply("⚠️ Vui lòng nhập ID máy chủ hoặc số thứ tự cần out!\nVí dụ: `!server out 1` hoặc `!server out 123456789...`");
            }

            const result = await handleLeaveServer(client, query);
            return message.reply(result.message);
        }

        return message.reply("⚠️ Cú pháp không hợp lệ! Dùng: `!server list` hoặc `!server out <id/stt>`");
    }
};

/**
 * Xử lý rời khỏi server theo ID, STT hoặc Tên
 */
async function handleLeaveServer(client, query) {
    const guilds = Array.from(client.guilds.cache.values());

    let targetGuild = null;

    // 1. Kiểm tra nếu là số thứ tự (1, 2, 3,...)
    const index = parseInt(query);
    if (!isNaN(index) && index >= 1 && index <= guilds.length) {
        targetGuild = guilds[index - 1];
    }

    // 2. Kiểm tra nếu là ID máy chủ
    if (!targetGuild) {
        targetGuild = client.guilds.cache.get(query);
    }

    // 3. Kiểm tra theo tên máy chủ
    if (!targetGuild) {
        targetGuild = client.guilds.cache.find(g => g.name.toLowerCase() === query.toLowerCase());
    }

    if (!targetGuild) {
        return {
            success: false,
            message: `❌ Không tìm thấy máy chủ nào khớp với: \`${query}\`!\nHãy gõ \`!server list\` để xem danh sách và số thứ tự chính xác.`
        };
    }

    const guildName = targetGuild.name;
    const guildId = targetGuild.id;
    const memberCount = targetGuild.memberCount;

    try {
        await targetGuild.leave();
        return {
            success: true,
            message: `✅ Bot đã rời khỏi máy chủ **${guildName}** (ID: \`${guildId}\` | 👥 ${memberCount} thành viên) thành công!`
        };
    } catch (err) {
        return {
            success: false,
            message: `❌ Lỗi khi rời máy chủ **${guildName}**: ${err.message}`
        };
    }
}

/**
 * Tạo Embed hiển thị danh sách các máy chủ Bot tham gia
 */
function buildServerListEmbed(client) {
    const guilds = Array.from(client.guilds.cache.values());
    const totalGuilds = guilds.length;
    const totalUsers = guilds.reduce((acc, g) => acc + (g.memberCount || 0), 0);

    const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🌐 DANH SÁCH MÁY CHỦ BOT ĐANG THAM GIA")
        .setDescription(`Hiện tại bot đang hoạt động ở **${totalGuilds}** máy chủ với tổng cộng **${totalUsers.toLocaleString()}** thành viên.`)
        .setFooter({ text: "Dùng '!server out <stt>' hoặc '!server out <id>' để out máy chủ" })
        .setTimestamp();

    if (totalGuilds === 0) {
        embed.addFields({ name: "Thông báo", value: "Bot chưa tham gia máy chủ nào!" });
        return embed;
    }

    // Giới hạn hiển thị 25 máy chủ đầu tiên nếu quá nhiều
    const displayGuilds = guilds.slice(0, 25);
    const listText = displayGuilds.map((g, idx) => {
        return `\`${idx + 1}.\` **${g.name}**\n   • ID: \`${g.id}\` | 👥 Thành viên: **${g.memberCount}** | 👑 Owner ID: \`${g.ownerId}\``;
    }).join("\n\n");

    embed.addFields({
        name: `📋 Danh sách (${displayGuilds.length}/${totalGuilds})`,
        value: listText || "Không có dữ liệu"
    });

    return embed;
}
