/**
 * LỆNH BOT AI - TRÒ CHUYỆN THÔNG MINH QUA GROQ API (QWEN 3.8 / GPT OSS 120B)
 * Hỗ trợ các aliases: !ai, !chat, !bot, !anh, !beanh
 */

const { SlashCommandBuilder } = require("discord.js");
const { generateBotReply, extractMusicRequest, ADMIN_NAME, ADMIN_UID } = require("../../utils/beAnhAI");
const { getPrefix, isAdmin } = require("../../utils/settings");

module.exports = {
    name: "bot",
    description: "Trò chuyện trực tiếp cùng Bot AI (sử dụng Groq API siêu tốc)",
    category: "Tiện ích",
    aliases: ["ai", "chat", "anh", "beanh"],
    cooldown: 2,
    permissions: 0,
    data: new SlashCommandBuilder()
        .setName("bot")
        .setDescription("Trò chuyện trực tiếp cùng Bot AI (Groq API)")
        .addStringOption(opt =>
            opt.setName("message")
                .setDescription("Nội dung muốn nói hoặc hỏi Bot")
                .setRequired(true)
        ),

    async executeSlash(interaction) {
        const prompt = interaction.options.getString("message");
        await interaction.deferReply();

        const isUserAdmin = isAdmin(interaction.user.id) || String(interaction.user.id) === ADMIN_UID;
        const userName = interaction.member?.displayName || interaction.user.displayName || interaction.user.username;
        const reply = await generateBotReply(prompt, interaction.channelId, userName, isUserAdmin);
        return interaction.editReply(reply);
    },

    async executePrefix(message, args) {
        const prefix = getPrefix(message.guildId);

        if (!args || args.length === 0) {
            return message.reply(
                `🤖 [ TRỢ LÝ BOT AI - GROQ POWERED ] 🤖\n\n` +
                `👑 Quản trị viên: ${ADMIN_NAME} (${ADMIN_UID})\n` +
                `⚡ Model AI: Qwen 3.8 27B / GPT OSS 120B (Groq Cloud)\n` +
                `👉 Cách dùng:\n` +
                `• Chat trực tiếp: \`${prefix}ai <câu hỏi>\` hoặc \`${prefix}chat <nội dung>\`\n` +
                `• Mở nhạc nhanh: Nhắn \`bot mở nhạc <tên bài>\` hoặc \`${prefix}sing <tên bài>\`\n` +
                `• Tự động trò chuyện: Nhắn tin có từ \`bot\`, \`bot ơi\` hoặc reply tin nhắn của bot!`
            );
        }

        const prompt = args.join(" ").trim();
        const senderID = String(message.author?.id || message.senderID || "");
        const isUserAdmin = isAdmin(senderID) || senderID === ADMIN_UID;
        const userName = isUserAdmin ? ADMIN_NAME : (message.author?.displayName || message.author?.username || "Bạn");

        // Kiểm tra nếu là yêu cầu mở nhạc
        const musicReq = extractMusicRequest(prompt);
        if (musicReq && musicReq.hasIntent && musicReq.query) {
            const waitMsg = await message.reply(`🎵 Đang tìm kiếm và phát bài: **${musicReq.query}**...`);
            const { playFirstSongDirectly } = require("./sing");
            return await playFirstSongDirectly({
                isSlash: false,
                context: waitMsg,
                query: musicReq.query,
                user: message.author,
                channel: message.channel
            });
        }

        const reply = await generateBotReply(prompt, message.channel?.id || message.threadID, userName, isUserAdmin);
        return message.reply(reply);
    }
};
