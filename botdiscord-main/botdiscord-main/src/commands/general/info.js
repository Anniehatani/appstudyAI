const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const moment = require("moment-timezone");

function buildUserEmbed(targetUser, member) {
    const createdAt = moment(targetUser.createdAt).tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
    const joinedAt = member?.joinedAt 
        ? moment(member.joinedAt).tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY") 
        : "Không ở trong máy chủ này";

    const roles = member?.roles?.cache
        ?.filter(r => r.id !== member.guild.id)
        ?.map(r => r.name)
        ?.slice(0, 10)
        ?.join(", ") || "Không có";

    return new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle(`👤 THÔNG TIN NGƯỜI DÙNG: ${targetUser.tag}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
        .addFields(
            { name: "🆔 ID", value: `\`${targetUser.id}\``, inline: true },
            { name: "🏷️ Biệt danh", value: member?.nickname || targetUser.displayName || "Không có", inline: true },
            { name: "🤖 Bot?", value: targetUser.bot ? "Có" : "Không", inline: true },
            { name: "📅 Ngày tạo tài khoản", value: createdAt, inline: true },
            { name: "📥 Ngày tham gia server", value: joinedAt, inline: true },
            { name: "🎭 Vai trò chính", value: member?.roles?.highest?.name || "Không có", inline: true },
            { name: "📜 Danh sách vai trò", value: roles.length > 1024 ? roles.substring(0, 1020) + "..." : roles, inline: false }
        )
        .setTimestamp();
}

module.exports = {
    name: "info",
    description: "Xem thông tin người dùng Discord hoặc thông tin bản thân",
    category: "Tiện ích",
    aliases: ["userinfo", "whois"],
    cooldown: 5,
    permissions: 0,
    data: new SlashCommandBuilder()
        .setName("info")
        .setDescription("Xem thông tin người dùng Discord")
        .addUserOption(opt =>
            opt.setName("user")
                .setDescription("Chọn người dùng cần xem thông tin")
                .setRequired(false)
        ),

    async executeSlash(interaction) {
        const targetUser = interaction.options.getUser("user") || interaction.user;
        const member = interaction.guild ? await interaction.guild.members.fetch(targetUser.id).catch(() => null) : null;
        const embed = buildUserEmbed(targetUser, member);
        await interaction.reply({ embeds: [embed] });
    },

    async executePrefix(message, args) {
        let targetUser = message.mentions.users.first();
        if (!targetUser && args[0]) {
            try {
                targetUser = await message.client.users.fetch(args[0]).catch(() => null);
            } catch (e) {}
        }
        if (!targetUser) targetUser = message.author;

        const member = message.guild ? await message.guild.members.fetch(targetUser.id).catch(() => null) : null;
        const embed = buildUserEmbed(targetUser, member);
        await message.reply({ embeds: [embed] });
    }
};
