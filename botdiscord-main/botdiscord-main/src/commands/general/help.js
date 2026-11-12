const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getPrefix } = require("../../utils/settings");

module.exports = {
    name: "help",
    description: "Hiển thị danh sách tất cả các lệnh của bot",
    category: "Tiện ích",
    aliases: ["menu"],
    cooldown: 5,
    permissions: 0,
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Hiển thị danh sách tất cả các lệnh của bot")
        .addStringOption(opt =>
            opt.setName("command")
                .setDescription("Xem chi tiết một lệnh cụ thể")
                .setRequired(false)
        ),

    async executeSlash(interaction, { client, commands }) {
        const query = interaction.options.getString("command");
        const prefix = getPrefix(interaction.guildId);
        const embed = buildHelpEmbed(commands, prefix, query);
        await interaction.reply({ embeds: [embed] });
    },

    async executePrefix(message, args, { commands }) {
        const query = args[0]?.toLowerCase();
        const prefix = getPrefix(message.guildId);
        const embed = buildHelpEmbed(commands, prefix, query);
        await message.reply({ embeds: [embed] });
    }
};

function buildHelpEmbed(commands, prefix, query) {
    if (query) {
        const cmd = commands.get(query) || Array.from(commands.values()).find(c => c.aliases?.includes(query));
        if (!cmd) {
            return new EmbedBuilder()
                .setColor("#FF4444")
                .setTitle("❌ Không tìm thấy lệnh")
                .setDescription(`Không tìm thấy lệnh mang tên \`${query}\`! Gõ \`${prefix}help\` để xem tất cả lệnh.`);
        }

        const roleRequirements = ["Mọi người", "Quản trị viên (QTV)", "Người hỗ trợ (NDH)", "ADMIN BOT"];
        const permText = roleRequirements[cmd.permissions || 0] || "Mọi người";

        return new EmbedBuilder()
            .setColor("#00D26A")
            .setTitle(`📖 CHI TIẾT LỆNH: ${cmd.name.toUpperCase()}`)
            .addFields(
                { name: "📝 Mô tả", value: cmd.description || "Không có mô tả" },
                { name: "🏷️ Danh mục", value: cmd.category || "Chung", inline: true },
                { name: "⏳ Cooldown", value: `${cmd.cooldown || 1}s`, inline: true },
                { name: "🔒 Quyền hạn", value: permText, inline: true },
                { name: "🔤 Tên gọi khác", value: cmd.aliases?.length ? cmd.aliases.map(a => `\`${a}\``).join(", ") : "Không có", inline: true },
                { name: "💡 Cách dùng", value: `• Dùng tiền tố: \`${prefix}${cmd.name}\`\n• Dùng Slash: \`/${cmd.name}\``, inline: false }
            )
            .setTimestamp();
    }

    // Nhóm các lệnh theo category
    const categories = {
        "Quản trị": [],
        "Hệ thống": [],
        "Tiện ích": [],
        "Phương tiện": []
    };

    commands.forEach(cmd => {
        const cat = cmd.category || "Tiện ích";
        if (!categories[cat]) categories[cat] = [];
        // Chỉ thêm 1 lần (tránh aliases)
        if (!categories[cat].some(c => c.name === cmd.name)) {
            categories[cat].push(cmd);
        }
    });

    const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("✨ DANH SÁCH LỆNH DISCORD BOT ✨")
        .setDescription(
            `• Tiền tố hiện tại của máy chủ: \`${prefix}\`\n` +
            `• Bot hỗ trợ cả **Slash Command (\`/\`)** và **Prefix Command (\`${prefix}\`)**.\n` +
            `• Gõ \`${prefix}help <tên lệnh>\` để xem hướng dẫn chi tiết.`
        );

    const icons = {
        "Quản trị": "👑",
        "Hệ thống": "⚙️",
        "Tiện ích": "🛠️",
        "Phương tiện": "🎬"
    };

    for (const [cat, list] of Object.entries(categories)) {
        if (list.length === 0) continue;
        const icon = icons[cat] || "📌";
        const cmdList = list.map(c => `\`${c.name}\``).join(", ");
        embed.addFields({
            name: `${icon} ${cat} (${list.length})`,
            value: cmdList,
            inline: false
        });
    }

    embed.setFooter({ text: `Tổng cộng: ${commands.size} lệnh có sẵn • ⏱️ Menu tự động thu hồi sau 6 giây` });
    embed.setTimestamp();
    return embed;
}

