const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const moment = require("moment-timezone");
const { getAdmins, getPrefix } = require("../../utils/settings");

module.exports = {
    name: "annie",
    description: "Gửi tin nhắn yêu cầu hỗ trợ trực tiếp đến Chủ Bot (Admin)",
    category: "Tiện ích",
    aliases: ["support", "callad", "lienhe", "trogiup"],
    cooldown: 15, // Cooldown 15 giây chống spam
    permissions: 0, // Mọi người đều có thể dùng
    data: new SlashCommandBuilder()
        .setName("annie")
        .setDescription("Gửi tin nhắn yêu cầu hỗ trợ đến Chủ Bot")
        .addStringOption(opt =>
            opt.setName("message")
                .setDescription("Nội dung cần hỗ trợ hoặc nhắn gửi tới chủ bot")
                .setRequired(true)
        ),

    async executeSlash(interaction, { client }) {
        const content = interaction.options.getString("message").trim();
        await interaction.deferReply();

        const result = await sendSupportToAdmins(client, interaction.user, interaction.guild, interaction.channel, content);
        return interaction.editReply({ content: result.message });
    },

    async executePrefix(message, args, { client }) {
        const prefix = getPrefix(message.guildId);
        const content = args.join(" ").trim();

        if (!content) {
            return message.reply(
                `⚠️ Vui lòng nhập nội dung cần hỗ trợ!\n` +
                `👉 Ví dụ: \`${prefix}annie Bot ơi lệnh nhạc bị lỗi rồi, hỗ trợ mình với ạ!\``
            );
        }

        const waitMsg = await message.reply("⏳ Đang gửi tin nhắn đến Chủ Bot, vui lòng chờ...");
        const result = await sendSupportToAdmins(client, message.author, message.guild, message.channel, content);

        await waitMsg.edit(result.message).catch(() => {});
    }
};

/**
 * Xử lý chuyển tiếp tin nhắn hỗ trợ qua DM tới tất cả Admin Bot
 */
async function sendSupportToAdmins(client, user, guild, channel, content) {
    const adminIds = getAdmins();

    if (!adminIds || adminIds.length === 0) {
        return {
            success: false,
            message: "⚠️ Hiện tại hệ thống chưa cấu hình danh sách **ADMIN BOT**! Hãy liên hệ người tạo bot nhé."
        };
    }

    const timeStr = moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
    const guildName = guild ? `${guild.name} (ID: ${guild.id})` : "Tin nhắn riêng (DM)";
    const channelName = channel ? `#${channel.name} (ID: ${channel.id})` : "Direct Message";

    const adminEmbed = new EmbedBuilder()
        .setColor("#FF8C00")
        .setTitle("🚨 YÊU CẦU HỖ TRỢ MỚI TỪ NGƯỜI DÙNG")
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
            { name: "👤 Người gửi", value: `${user.tag} (<@${user.id}>)`, inline: true },
            { name: "🆔 User ID", value: `\`${user.id}\``, inline: true },
            { name: "⏰ Thời gian gửi", value: timeStr, inline: true },
            { name: "🌐 Máy chủ", value: guildName, inline: false },
            { name: "💬 Kênh chat", value: channelName, inline: false },
            { name: "📝 Nội dung hỗ trợ", value: `>>> ${content}`, inline: false }
        )
        .setFooter({ text: "Gõ tin nhắn riêng tới ID người dùng trên để phản hồi hỗ trợ" })
        .setTimestamp();

    let successCount = 0;

    for (const adminId of adminIds) {
        try {
            const adminUser = await client.users.fetch(adminId).catch(() => null);
            if (adminUser) {
                await adminUser.send({
                    content: `🔔 **Bạn có một yêu cầu hỗ trợ mới từ người dùng Discord!**`,
                    embeds: [adminEmbed]
                });
                successCount++;
            }
        } catch (err) {
            // Admin có thể khóa DM từ bot hoặc người lạ
        }
    }

    if (successCount > 0) {
        return {
            success: true,
            message: `✅ Yêu cầu hỗ trợ của bạn đã được gửi trực tiếp đến **Chủ Bot** (\`${successCount}\` Admin đã nhận)! Vui lòng chờ phản hồi sớm nhé. 💖`
        };
    } else {
        return {
            success: false,
            message: `⚠️ Không thể gửi tin nhắn riêng cho Chủ Bot (có thể do Chủ Bot đã tắt tính năng nhận tin nhắn từ người lạ). Vui lòng liên hệ Admin trực tiếp!`
        };
    }
}
