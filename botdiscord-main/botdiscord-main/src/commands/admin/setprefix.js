const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { setPrefix, getPrefix } = require("../../utils/settings");

module.exports = {
    name: "setprefix",
    description: "Thay đổi tiền tố (prefix) lệnh cho máy chủ này",
    category: "Quản trị",
    aliases: ["prefix"],
    cooldown: 5,
    permissions: 1, // QTV server
    data: new SlashCommandBuilder()
        .setName("setprefix")
        .setDescription("Thay đổi tiền tố lệnh cho máy chủ")
        .addStringOption(opt =>
            opt.setName("prefix")
                .setDescription("Tiền tố mới (ví dụ: !, ?, ., /)")
                .setRequired(true)
                .setMaxLength(5)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async executeSlash(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "❌ Lệnh này chỉ dùng trong máy chủ!", ephemeral: true });
        }

        const newPrefix = interaction.options.getString("prefix").trim();
        if (!newPrefix || newPrefix.length > 5) {
            return interaction.reply({ content: "⚠️ Tiền tố không được rỗng và tối đa 5 ký tự!", ephemeral: true });
        }

        setPrefix(interaction.guildId, newPrefix);
        await interaction.reply({ content: `✅ Đã đổi tiền tố của máy chủ thành: \`${newPrefix}\`\n👉 Ví dụ: \`${newPrefix}ping\`, \`${newPrefix}help\`` });
    },

    async executePrefix(message, args) {
        if (!message.guild) return message.reply("❌ Lệnh này chỉ dùng trong máy chủ!");

        const newPrefix = args[0]?.trim();
        if (!newPrefix || newPrefix.length > 5) {
            const currentPrefix = getPrefix(message.guildId);
            return message.reply(`⚠️ Vui lòng nhập tiền tố mới (tối đa 5 ký tự)!\nTiền tố hiện tại: \`${currentPrefix}\`\nVí dụ: \`${currentPrefix}setprefix .\``);
        }

        setPrefix(message.guildId, newPrefix);
        await message.reply(`✅ Đã đổi tiền tố của máy chủ thành: \`${newPrefix}\`\n👉 Ví dụ dùng: \`${newPrefix}ping\`, \`${newPrefix}help\``);
    }
};
