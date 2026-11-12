const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "kick",
    description: "Đá thành viên ra khỏi máy chủ Discord",
    category: "Quản trị",
    aliases: [],
    cooldown: 5,
    permissions: 1, // QTV server
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Đá thành viên khỏi máy chủ")
        .addUserOption(opt => opt.setName("user").setDescription("Chọn thành viên cần đá").setRequired(true))
        .addStringOption(opt => opt.setName("reason").setDescription("Lý do đá").setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async executeSlash(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "❌ Lệnh này chỉ dùng trong máy chủ!", ephemeral: true });
        }

        const targetUser = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason") || "Không có lý do";

        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!member) {
            return interaction.reply({ content: "❌ Người dùng này không có trong máy chủ!", ephemeral: true });
        }

        if (!member.kickable) {
            return interaction.reply({ content: `❌ Bot không thể đá **${targetUser.tag}** (vai trò người này cao hơn Bot)!`, ephemeral: true });
        }

        try {
            await member.kick(reason);
            const embed = new EmbedBuilder()
                .setColor("#FFA500")
                .setTitle("👢 ĐÃ ĐÁ THÀNH VIÊN")
                .setDescription(`Đã đá **${targetUser.tag}** ra khỏi máy chủ!\n**Lý do:** ${reason}`)
                .setFooter({ text: `Thực hiện bởi ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (e) {
            interaction.reply({ content: `❌ Lỗi khi đá thành viên: ${e.message}`, ephemeral: true });
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
            return message.reply("⚠️ Vui lòng tag @User hoặc nhập ID cần kick! Ví dụ: `!kick @User Gây rối`");
        }

        const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
        if (!member) return message.reply("❌ Người dùng này không có trong máy chủ!");

        if (!member.kickable) {
            return message.reply(`❌ Không thể đá **${targetUser.tag}** (vai trò người này cao hơn Bot)!`);
        }

        try {
            await member.kick(reason);
            const embed = new EmbedBuilder()
                .setColor("#FFA500")
                .setTitle("👢 ĐÃ ĐÁ THÀNH VIÊN")
                .setDescription(`Đã đá **${targetUser.tag}** ra khỏi máy chủ!\n**Lý do:** ${reason}`)
                .setFooter({ text: `Thực hiện bởi ${message.author.tag}` })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } catch (e) {
            message.reply(`❌ Lỗi khi đá thành viên: ${e.message}`);
        }
    }
};
