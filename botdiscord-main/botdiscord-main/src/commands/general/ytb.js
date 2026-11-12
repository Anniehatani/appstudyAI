const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    AttachmentBuilder,
    ComponentType
} = require("discord.js");
const moment = require("moment-timezone");
const { search5, downloadVideo, cleanupFile } = require("../../utils/youtubeDownloader");

module.exports = {
    name: "ytb",
    description: "Tìm kiếm 5 video YouTube và tải gửi trực tiếp file video MP4 lên Discord",
    category: "Phương tiện",
    aliases: ["video", "yt", "youtube"],
    cooldown: 5,
    permissions: 0,
    data: new SlashCommandBuilder()
        .setName("ytb")
        .setDescription("Tìm kiếm 5 video YouTube và gửi trực tiếp video MP4")
        .addStringOption(opt =>
            opt.setName("query")
                .setDescription("Tên video hoặc link YouTube cần tìm")
                .setRequired(true)
        ),

    async executeSlash(interaction) {
        const query = interaction.options.getString("query").trim();
        await interaction.deferReply();

        await handleSearchAndSendVideo({
            isSlash: true,
            context: interaction,
            query,
            user: interaction.user,
            channel: interaction.channel
        });
    },

    async executePrefix(message, args) {
        if (!args || args.length === 0) {
            return message.reply("⚠️ Vui lòng nhập từ khóa tìm kiếm video YouTube hoặc dán link!\n💡 Ví dụ: `!ytb Doraemon tập 1` hoặc `!ytb https://youtu.be/...`");
        }

        const query = args.join(" ").trim();
        const loadingMsg = await message.reply(`🔍 Đang tìm kiếm 5 video cho: **${query}**...`);

        await handleSearchAndSendVideo({
            isSlash: false,
            context: loadingMsg,
            query,
            user: message.author,
            channel: message.channel
        });
    }
};

/**
 * Xử lý tìm kiếm 5 video YouTube và cho người dùng chọn
 */
async function handleSearchAndSendVideo({ isSlash, context, query, user, channel }) {
    try {
        const list = await search5(query);

        if (!list || list.length === 0) {
            const errContent = `❌ Không tìm thấy video nào với từ khóa: **${query}**!`;
            if (isSlash) return context.editReply({ content: errContent });
            return context.edit({ content: errContent });
        }

        // Nếu chỉ có 1 kết quả (dán link trực tiếp)
        if (list.length === 1) {
            const item = list[0];
            if (item.durationSec && item.durationSec > 5400) {
                const limitMsg = `⛔ Video này dài hơn 1 tiếng rưỡi (\`${item.duration}\`)! Bot chỉ hỗ trợ tải video dưới 1 tiếng rưỡi và tối đa 50MB.`;
                if (isSlash) return context.editReply({ content: limitMsg });
                return context.edit({ content: limitMsg });
            }
            return await processDownloadAndSendVideo(context, item, user);
        }

        // Hiển thị danh sách 5 video
        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle(`🎬 KẾT QUẢ TÌM KIẾM VIDEO: "${query.slice(0, 40)}"`)
            .setDescription(
                list.map((item, idx) => {
                    return `**${idx + 1}.** [${item.title}](${item.url})\n   ⏱️ Thời lượng: \`${item.duration}\` | 👤 Kênh: \`${item.channel}\``;
                }).join("\n\n")
            )
            .setThumbnail(list[0].thumbnail)
            .setFooter({ text: "👉 Bấm nút 1 - 5 (hoặc gõ số 1 - 5) trong 30s • Giới hạn: dưới 1 tiếng rưỡi & tối đa 50MB" });

        const row1 = new ActionRowBuilder();
        const numbers = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
        for (let i = 0; i < list.length; i++) {
            row1.addComponents(
                new ButtonBuilder()
                    .setCustomId(`ytb_select_${i}`)
                    .setLabel(`${i + 1}`)
                    .setEmoji(numbers[i])
                    .setStyle(ButtonStyle.Success)
            );
        }

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("ytb_cancel")
                .setLabel("Hủy thao tác")
                .setEmoji("❌")
                .setStyle(ButtonStyle.Danger)
        );

        const components = [row1, row2];

        let promptMsg;
        if (isSlash) {
            promptMsg = await context.editReply({
                content: `🎥 Chọn video bạn muốn tải và xem (tối đa 1 tiếng rưỡi & 50MB):`,
                embeds: [embed],
                components
            });
        } else {
            promptMsg = await context.edit({
                content: `🎥 Chọn video bạn muốn tải và xem (tối đa 1 tiếng rưỡi & 50MB):`,
                embeds: [embed],
                components
            });
        }

        // Lắng nghe bấm Button
        const buttonCollector = promptMsg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 30000
        });

        // Lắng nghe gõ text 1 - 5
        const textCollector = channel.createMessageCollector({
            filter: m => m.author.id === user.id && /^[1-5]$/.test(m.content.trim()),
            time: 30000,
            max: 1
        });

        let isHandled = false;

        async function handleSelection(selectedIndex) {
            if (isHandled) return;

            const chosen = list[selectedIndex];
            if (!chosen) return;

            // Kiểm tra thời lượng video (dưới 1 tiếng rưỡi = 5400s)
            if (chosen.durationSec && chosen.durationSec > 5400) {
                isHandled = true;
                buttonCollector.stop();
                textCollector.stop();
                return promptMsg.edit({
                    content: `⛔ Video **${chosen.title}** dài hơn 1 tiếng rưỡi (\`${chosen.duration}\`)! Bot chỉ hỗ trợ video dưới 1 tiếng rưỡi và tối đa 50MB.`,
                    embeds: [],
                    components: []
                });
            }

            isHandled = true;
            buttonCollector.stop();
            textCollector.stop();

            await processDownloadAndSendVideo(promptMsg, chosen, user);
        }

        buttonCollector.on("collect", async (i) => {
            if (i.user.id !== user.id) {
                return i.reply({ content: "⛔ Chỉ người gọi lệnh mới được chọn video này!", ephemeral: true });
            }

            if (i.customId === "ytb_cancel") {
                isHandled = true;
                buttonCollector.stop();
                textCollector.stop();
                return i.update({ content: "❌ Đã hủy chọn video.", embeds: [], components: [] });
            }

            await i.deferUpdate();
            const index = parseInt(i.customId.replace("ytb_select_", ""));
            await handleSelection(index);
        });

        textCollector.on("collect", async (m) => {
            const index = parseInt(m.content.trim()) - 1;
            m.delete().catch(() => {});
            await handleSelection(index);
        });

        buttonCollector.on("end", async (_, reason) => {
            if (!isHandled && reason === "time") {
                promptMsg.edit({
                    content: "⏱️ Đã hết 30 giây thời gian chọn video!",
                    components: []
                }).catch(() => {});
            }
        });

    } catch (err) {
        console.error("Lỗi tìm kiếm lệnh ytb:", err);
        const errMsg = `❌ Lỗi khi tìm kiếm video: ${err.message}`;
        if (isSlash) return context.editReply({ content: errMsg, embeds: [], components: [] });
        return context.edit({ content: errMsg, embeds: [], components: [] });
    }
}

/**
 * Tải file video MP4 và gửi trực tiếp vào Discord, gửi xong xóa file
 */
async function processDownloadAndSendVideo(msgContext, video, user) {
    const statusContent = `⏳ Đang tải video MP4 **${video.title}**...\nVui lòng chờ trong giây lát nhé! 🎬`;
    await msgContext.edit({ content: statusContent, embeds: [], components: [] });

    let downloadResult = null;
    try {
        downloadResult = await downloadVideo(video.id);

        const timeStr = moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
        const sizeMB = (downloadResult.fileSize / 1024 / 1024).toFixed(2);

        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle(`🎬 ${downloadResult.title}`)
            .setURL(`https://www.youtube.com/watch?v=${video.id}`)
            .setThumbnail(downloadResult.thumbnail)
            .addFields(
                { name: "👤 Kênh YouTube", value: `\`${downloadResult.channel}\``, inline: true },
                { name: "⏰ Thời lượng", value: `\`${downloadResult.duration}\``, inline: true },
                { name: "📦 Dung lượng", value: `\`${sizeMB} MB\``, inline: true },
                { name: "🎬 Người yêu cầu", value: `<@${user.id}>`, inline: true }
            )
            .setFooter({ text: `YouTube Video MP4 • ${timeStr}` });

        const attachment = new AttachmentBuilder(downloadResult.filePath, {
            name: downloadResult.fileName
        });

        await msgContext.edit({
            content: `🎥 **Đã tải xong video:** ${downloadResult.title}`,
            embeds: [embed],
            files: [attachment],
            components: []
        });
    } catch (err) {
        console.error("Lỗi tải video ytb:", err);
        let errText = `❌ Không thể tải video: ${err.message}`;
        if (err.message.includes("40005") || err.message.includes("Payload Too Large") || err.code === 40005) {
            errText = `❌ Dung lượng video vượt quá giới hạn gửi file của máy chủ Discord này (tối đa 25MB - 50MB)!`;
        }
        await msgContext.edit({ content: errText, embeds: [], components: [] });
    } finally {
        // Format / Xóa sạch file cache sau khi gửi
        if (downloadResult && downloadResult.filePath) {
            cleanupFile(downloadResult.filePath);
        }
    }
}
