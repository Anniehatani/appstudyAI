const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "ban",
    description: "Cấm thành viên khỏi máy chủ Discord",
    category: "Quản trị",
    aliases: [],
    cooldown: 5,
    permissions: 1, // QTV server
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Cấm thành viên khỏi máy chủ")
        .addUserOption(opt => opt.setName("user").setDescription("Chọn thành viên cần cấm").setRequired(true))
        .addStringOption(opt => opt.setName("reason").setDescription("Lý do cấm").setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async executeSlash(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "❌ Lệnh này chỉ dùng trong máy chủ!", ephemeral: true });
        }

        const targetUser = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason") || "Không có lý do";

        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (member && !member.bannable) {
            return interaction.reply({ content: `❌ Bot không có đủ quyền để cấm **${targetUser.tag}** (vai trò của họ cao hơn Bot)!`, ephemeral: true });
        }

        try {
            await interaction.guild.members.ban(targetUser.id, { reason });
            const embed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("🔨 ĐÃ CẤM THÀNH VIÊN")
                .setDescription(`Đã cấm **${targetUser.tag}** khỏi máy chủ!\n**Lý do:** ${reason}`)
                .setFooter({ text: `Thực hiện bởi ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (e) {
            interaction.reply({ content: `❌ Lỗi khi cấm người dùng: ${e.message}`, ephemeral: true });
        }
    },

    async executePrefix(message, args) {
        if (!message.guild) return message.reply("❌ Lệnh này chỉ dùng trong máy chủ!");

        let targetUser = message.mentions.users.first();
        let reason = args.slice(1).join(" ") || "Không có lý do";

        if (!targetUser && args[0] && /^\d+$/.test(args[0])) {
            targetUser = await message.client.users.fetch(args[0]).catch(() => null);
            reason = args.slice(1).join(" ") || "Không có lý do";
        }

        if (!targetUser) {
            return message.reply("⚠️ Vui lòng tag @User hoặc nhập ID cần ban! Ví dụ: `!ban @User Vi phạm nội quy`");
        }

        const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
        if (member && !member.bannable) {
            return message.reply(`❌ Không thể cấm **${targetUser.tag}** (vai trò người này cao hơn Bot)!`);
        }

        try {
            await message.guild.members.ban(targetUser.id, { reason });
            const embed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("🔨 ĐÃ CẤM THÀNH VIÊN")
                .setDescription(`Đã cấm **${targetUser.tag}** khỏi máy chủ!\n**Lý do:** ${reason}`)
                .setFooter({ text: `Thực hiện bởi ${message.author.tag}` })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } catch (e) {
            message.reply(`❌ Lỗi khi cấm thành viên: ${e.message}`);
        }
    }
};
