const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    name: "unsend",
    description: "Gỡ / thu hồi tin nhắn của Bot khi reply hoặc thả cảm xúc dislike 👎",
    category: "Tiện ích",
    aliases: ["gỡ", "go", "uns", "thuhoi", "xoa"],
    cooldown: 1,
    permissions: 0,
    data: new SlashCommandBuilder()
        .setName("unsend")
        .setDescription("Gỡ tin nhắn gần nhất mà Bot đã gửi trong kênh này"),

    async executeSlash(interaction, { client }) {
        try {
            const channel = interaction.channel;
            const messages = await channel.messages.fetch({ limit: 20 });
            const botMessage = messages.find(m => m.author.id === client.user.id && m.id !== interaction.id);

            if (!botMessage) {
                return interaction.reply({ content: "❌ Không tìm thấy tin nhắn gần đây của Bot để gỡ!", ephemeral: true });
            }

            if (!botMessage.deletable) {
                return interaction.reply({ content: "❌ Bot không có quyền xóa tin nhắn này!", ephemeral: true });
            }

            await botMessage.delete();
            await interaction.reply({ content: "✅ Đã gỡ tin nhắn thành công!", ephemeral: true });
        } catch (e) {
            interaction.reply({ content: `❌ Không thể gỡ tin nhắn: ${e.message}`, ephemeral: true });
        }
    },

    async executePrefix(message, args, { client }) {
        try {
            // Trường hợp 1: Reply tin nhắn của bot để gỡ
            if (message.reference && message.reference.messageId) {
                const targetMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
                if (targetMsg && targetMsg.author.id === client.user.id) {
                    if (targetMsg.deletable) await targetMsg.delete().catch(() => {});
                    if (message.deletable) await message.delete().catch(() => {});
                    return;
                }
            }

            // Trường hợp 2: Gỡ tin nhắn bot vừa gửi gần nhất
            const messages = await message.channel.messages.fetch({ limit: 20 });
            const botMessage = messages.find(m => m.author.id === client.user.id && m.id !== message.id);
            if (botMessage && botMessage.deletable) {
                await botMessage.delete().catch(() => {});
                if (message.deletable) await message.delete().catch(() => {});
            } else {
                const replyErr = await message.reply("❌ Không tìm thấy tin nhắn gần đây của bot để gỡ!");
                setTimeout(() => replyErr.delete().catch(() => {}), 3000);
            }
        } catch (e) {
            console.error("Lỗi khi gỡ tin nhắn:", e.message);
        }
    }
};
