const {
    SlashCommandBuilder,
    EmbedBuilder,
    AttachmentBuilder
} = require("discord.js");
const moment = require("moment-timezone");
const { search5, downloadAudio, cleanupFile } = require("../../utils/youtubeDownloader");

module.exports = {
    name: "sing",
    description: "Tìm bài hát và tự động tải gửi trực tiếp file âm thanh (audio/voice) lên Discord",
    category: "Nhạc",
    aliases: ["ytdl", "play", "nhac", "music", "baihat", "audio"],
    cooldown: 5,
    permissions: 0,
    data: new SlashCommandBuilder()
        .setName("sing")
        .setDescription("Tìm bài hát và tải file âm thanh gửi lên Discord (tự chọn bài đầu tiên)")
        .addStringOption(opt =>
            opt.setName("song")
                .setDescription("Tên bài hát hoặc link YouTube cần phát")
                .setRequired(true)
        ),

    async executeSlash(interaction) {
        const query = interaction.options.getString("song").trim();
        await interaction.deferReply();

        await playFirstSongDirectly({
            isSlash: true,
            context: interaction,
            query,
            user: interaction.user,
            channel: interaction.channel
        });
    },

    async executePrefix(message, args) {
        if (!args || args.length === 0) {
            return message.reply("⚠️ Vui lòng nhập tên bài hát hoặc link YouTube!\n💡 Ví dụ: `!sing lowG` hoặc `!sing See You Again`");
        }

        const query = args.join(" ").trim();
        const loadingMsg = await message.reply(`🔍 Đang tìm kiếm và chuẩn bị phát: **${query}**... 🎵`);

        await playFirstSongDirectly({
            isSlash: false,
            context: loadingMsg,
            query,
            user: message.author,
            channel: message.channel
        });
    },

    playFirstSongDirectly
};

/**
 * Tìm kiếm bài hát và tự động tải phát ngay bài đầu tiên, không cần chọn tay
 */
async function playFirstSongDirectly({ isSlash, context, query, user, channel }) {
    try {
        const list = await search5(query);

        if (!list || list.length === 0) {
            const errContent = `❌ Không tìm thấy bài hát nào với từ khóa: **${query}**!`;
            if (isSlash) return context.editReply({ content: errContent });
            return context.edit({ content: errContent });
        }

        // Tự động lấy ngay bài đầu tiên
        const chosen = list[0];
        await processDownloadAndSend(context, chosen, user, isSlash);
    } catch (err) {
        console.error("Lỗi tìm kiếm lệnh sing:", err);
        const errMsg = `❌ Lỗi khi tìm kiếm bài hát: ${err.message}`;
        if (isSlash) return context.editReply({ content: errMsg, embeds: [], components: [] });
        return context.edit({ content: errMsg, embeds: [], components: [] });
    }
}

/**
 * Tải file âm thanh và gửi đính kèm voice/audio vào Discord, gửi xong xóa file
 */
async function processDownloadAndSend(msgContext, song, user, isSlash) {
    const statusContent = `⏳ Đang tải file âm thanh bài **${song.title}**...\nVui lòng chờ trong giây lát nhé! 🎵`;
    if (isSlash) {
        await msgContext.editReply({ content: statusContent, embeds: [], components: [] });
    } else {
        await msgContext.edit({ content: statusContent, embeds: [], components: [] });
    }

    let downloadResult = null;
    try {
        downloadResult = await downloadAudio(song.id);

        const timeStr = moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
        const sizeMB = (downloadResult.fileSize / 1024 / 1024).toFixed(2);

        const embed = new EmbedBuilder()
            .setColor("#00D26A")
            .setTitle(`🎵 ${downloadResult.title}`)
            .setURL(`https://www.youtube.com/watch?v=${song.id}`)
            .setThumbnail(downloadResult.thumbnail)
            .addFields(
                { name: "👤 Kênh / Ca sĩ", value: `\`${downloadResult.channel}\``, inline: true },
                { name: "⏰ Thời lượng", value: `\`${downloadResult.duration}\``, inline: true },
                { name: "📦 Dung lượng", value: `\`${sizeMB} MB\``, inline: true },
                { name: "🎧 Người yêu cầu", value: `<@${user.id}>`, inline: true }
            )
            .setFooter({ text: `Tiệm Nhạc Bot Annie 🌷 • ${timeStr}` });

        const attachment = new AttachmentBuilder(downloadResult.filePath, {
            name: downloadResult.fileName
        });

        const successPayload = {
            content: `🎶 **Đã tải xong bài hát:** ${downloadResult.title}`,
            embeds: [embed],
            files: [attachment],
            components: []
        };

        if (isSlash) {
            await msgContext.editReply(successPayload);
        } else {
            await msgContext.edit(successPayload);
        }
    } catch (err) {
        console.error("Lỗi tải bài hát sing:", err);
        const errText = `❌ Không thể tải file âm thanh: ${err.message}`;
        if (isSlash) {
            await msgContext.editReply({ content: errText, embeds: [], components: [] });
        } else {
            await msgContext.edit({ content: errText, embeds: [], components: [] });
        }
    } finally {
        // Xóa sạch file cache sau khi gửi
        if (downloadResult && downloadResult.filePath) {
            cleanupFile(downloadResult.filePath);
        }
    }
}
