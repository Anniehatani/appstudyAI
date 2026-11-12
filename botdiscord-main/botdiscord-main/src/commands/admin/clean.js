const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "clean",
    description: "Xóa tin nhắn hàng loạt trong kênh (tối đa 100 tin nhắn)",
    category: "Quản trị",
    aliases: ["purge", "clear"],
    cooldown: 3,
    permissions: 1, // QTV server
    data: new SlashCommandBuilder()
        .setName("clean")
        .setDescription("Xóa tin nhắn hàng loạt trong kênh")
        .addIntegerOption(opt =>
            opt.setName("amount")
                .setDescription("Số lượng tin nhắn cần xóa (1 - 100)")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async executeSlash(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "❌ Lệnh này chỉ dùng trong máy chủ!", ephemeral: true });
        }

        const amount = interaction.options.getInteger("amount");
        try {
            const deleted = await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({ content: `🧹 Đã dọn dẹp **${deleted.size}** tin nhắn thành công!`, ephemeral: true });
        } catch (e) {
            interaction.reply({ content: `❌ Không thể xóa tin nhắn: ${e.message}`, ephemeral: true });
        }
    },

    async executePrefix(message, args) {
        if (!message.guild) return message.reply("❌ Lệnh này chỉ dùng trong máy chủ!");

        const count = parseInt(args[0]) || 10;
        if (isNaN(count) || count < 1 || count > 100) {
            return message.reply("⚠️ Vui lòng nhập số tin nhắn cần xóa từ 1 đến 100! Ví dụ: `!clean 20`");
        }

        try {
            await message.delete().catch(() => {});
            const deleted = await message.channel.bulkDelete(count, true);
            const notice = await message.channel.send(`🧹 Đã dọn dẹp **${deleted.size}** tin nhắn!`);
            setTimeout(() => notice.delete().catch(() => {}), 4000);
        } catch (e) {
            message.reply(`❌ Lỗi khi dọn dẹp tin nhắn: ${e.message}`);
        }
    }
};
