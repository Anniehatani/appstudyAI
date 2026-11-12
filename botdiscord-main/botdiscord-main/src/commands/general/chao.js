const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { getTimeGreetingConfig, setTimeGreetingConfig, getPrefix, checkPermission } = require("../../utils/settings");
const { buildTimeGreetingEmbed, TIME_GREETINGS } = require("../../utils/timeGreeting");
const { getWelcomeChannel } = require("../../utils/welcome");
const { getWelcomeConfig } = require("../../utils/settings");

module.exports = {
    name: "chao",
    description: "Cấu hình tự động chào theo 4 khung giờ: 7H (Sáng), 11H (Trưa), 18H (Tối), 22H (Đêm)",
    category: "Tiện ích",
    aliases: ["chaotime", "timegreet"],
    cooldown: 3,
    permissions: 0, // Mọi người có thể xem status, bật/tắt yêu cầu QTV (Level 1)
    data: new SlashCommandBuilder()
        .setName("chao")
        .setDescription("Quản lý tính năng tự động gửi lời chào theo các mốc giờ 7H-11H-18H-22H")
        .addSubcommand(sub =>
            sub.setName("status")
                .setDescription("Xem trạng thái và nội dung lời chào 4 mốc giờ")
        )
        .addSubcommand(sub =>
            sub.setName("on")
                .setDescription("Bật tự động gửi lời chào lúc 7h, 11h, 18h, 22h")
        )
        .addSubcommand(sub =>
            sub.setName("off")
                .setDescription("Tắt tự động gửi lời chào lúc 7h, 11h, 18h, 22h")
        )
        .addSubcommand(sub =>
            sub.setName("test")
                .setDescription("Gửi thử nghiệm tin nhắn chào của một mốc giờ")
                .addIntegerOption(opt =>
                    opt.setName("hour")
                        .setDescription("Chọn mốc giờ muốn test")
                        .setRequired(true)
                        .addChoices(
                            { name: "7:00 - Buổi Sáng", value: 7 },
                            { name: "11:00 - Buổi Trưa", value: 11 },
                            { name: "18:00 - Buổi Tối", value: 18 },
                            { name: "22:00 - Ban Đêm / Chúc ngủ ngon", value: 22 }
                        )
                )
        ),

    async executeSlash(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "❌ Lệnh này chỉ dùng trong máy chủ!", ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        // Xem status
        if (sub === "status") {
            const prefix = getPrefix(guildId);
            const embed = buildChaoStatusEmbed(interaction.guild, prefix);
            return interaction.reply({ embeds: [embed] });
        }

        // Kiểm tra quyền QTV Server cho các thao tác on / off / test
        if (!checkPermission(interaction.member, interaction.user, 1)) {
            return interaction.reply({
                content: "⛔ Chỉ **Quản trị viên máy chủ (QTV)** mới có quyền bật/tắt hoặc thử nghiệm tính năng này!",
                ephemeral: true
            });
        }

        if (sub === "on") {
            setTimeGreetingConfig(guildId, true);
            return interaction.reply({
                content: "✅ Đã **BẬT** tự động gửi lời chào vào các khung giờ **7H (Sáng), 11H (Trưa), 18H (Tối), 22H (Đêm)**!"
            });
        }

        if (sub === "off") {
            setTimeGreetingConfig(guildId, false);
            return interaction.reply({
                content: "🛑 Đã **TẮT** tự động gửi lời chào theo các khung giờ 7H-11H-18H-22H!"
            });
        }

        if (sub === "test") {
            const hour = interaction.options.getInteger("hour");
            const welcomeConfig = getWelcomeConfig(guildId);
            const targetChannel = getWelcomeChannel(interaction.guild, welcomeConfig.channelId) || interaction.channel;
            const embed = buildTimeGreetingEmbed(hour, interaction.guild);

            await targetChannel.send({ embeds: [embed] });
            return interaction.reply({
                content: `✅ Đã gửi thử tin nhắn chào **${TIME_GREETINGS[hour].timeName}** vào kênh ${targetChannel}!`,
                ephemeral: true
            });
        }
    },

    async executePrefix(message, args) {
        if (!message.guild) return message.reply("❌ Lệnh này chỉ dùng trong máy chủ!");

        const prefix = getPrefix(message.guildId);
        const action = args[0]?.toLowerCase();

        // Xem trạng thái
        if (!action || action === "status") {
            const embed = buildChaoStatusEmbed(message.guild, prefix);
            return message.reply({ embeds: [embed] });
        }

        // Bật / tắt và test yêu cầu quyền QTV Server
        if (!checkPermission(message.member, message.author, 1)) {
            return message.reply("⛔ Bạn cần có quyền **Quản trị viên máy chủ (QTV)** để bật/tắt tính năng này!");
        }

        if (action === "on" || action === "bat") {
            setTimeGreetingConfig(message.guildId, true);
            return message.reply("✅ Đã **BẬT** tự động gửi lời chào vào các khung giờ: **7H (Sáng), 11H (Trưa), 18H (Tối), 22H (Đêm)**!");
        }

        if (action === "off" || action === "tat") {
            setTimeGreetingConfig(message.guildId, false);
            return message.reply("🛑 Đã **TẮT** tính năng tự động gửi lời chào theo các khung giờ 7H-11H-18H-22H!");
        }

        if (action === "test") {
            let hour = 7;
            const hourArg = args[1]?.toLowerCase();
            if (hourArg === "11" || hourArg === "trua") hour = 11;
            else if (hourArg === "18" || hourArg === "toi") hour = 18;
            else if (hourArg === "22" || hourArg === "dem" || hourArg === "ngon") hour = 22;
            else if (hourArg === "7" || hourArg === "sang") hour = 7;

            const welcomeConfig = getWelcomeConfig(message.guildId);
            const targetChannel = getWelcomeChannel(message.guild, welcomeConfig.channelId) || message.channel;
            const embed = buildTimeGreetingEmbed(hour, message.guild);

            await targetChannel.send({ embeds: [embed] });
            return message.reply(`✅ Đã gửi thử tin nhắn chào **${TIME_GREETINGS[hour].timeName}** vào kênh ${targetChannel}!`);
        }

        return message.reply(`⚠️ Cú pháp: \`${prefix}chao on\`, \`${prefix}chao off\`, \`${prefix}chao test [7|11|18|22]\` hoặc \`${prefix}chao status\``);
    }
};

/**
 * Bảng thông tin trạng thái tính năng tự động chào theo giờ
 */
function buildChaoStatusEmbed(guild, prefix) {
    const isEnabled = getTimeGreetingConfig(guild.id);
    const welcomeConfig = getWelcomeConfig(guild.id);
    const channel = getWelcomeChannel(guild, welcomeConfig.channelId);

    const channelDisplay = channel
        ? `${channel} (\`${channel.id}\`)`
        : "Chưa cấu hình (tự động dùng kênh hệ thống hoặc kênh đầu tiên)";

    const statusText = isEnabled
        ? "🟢 **Đang BẬT** (Tự động gửi lúc 7h, 11h, 18h, 22h)"
        : "🔴 **Đang TẮT**";

    return new EmbedBuilder()
        .setColor("#FFA500")
        .setTitle("⏰ TỰ ĐỘNG CHÀO THEO GIỜ (7H - 11H - 18H - 22H)")
        .setDescription(
            `Hệ thống sẽ tự động gửi lời chúc tốt đẹp tới toàn thể thành viên máy chủ **${guild.name}** vào đúng các khung giờ sinh hoạt trong ngày theo giờ Việt Nam.`
        )
        .addFields(
            { name: "⚙️ Trạng thái hoạt động", value: statusText, inline: false },
            { name: "📢 Kênh nhận lời chào", value: channelDisplay, inline: false },
            {
                name: "🕒 4 Khung giờ tự động gửi hàng ngày",
                value:
                    "• **07:00 (Sáng)**: Chào buổi sáng tốt lành, chúc ngày mới năng suất, nhắc ăn sáng 🥪\n" +
                    "• **11:00 (Trưa)**: Chúc bữa trưa ngon miệng, nghỉ trưa lấy lại năng lượng 🍱\n" +
                    "• **18:00 (Tối)**: Chào buổi tối ấm áp, thư giãn sau giờ học/làm việc 🍲\n" +
                    "• **22:00 (Đêm)**: Chúc cả nhà ngủ thật ngon, có những giấc mơ đẹp 🌙💤",
                inline: false
            },
            {
                name: "🛠️ Cách dùng lệnh",
                value:
                    `• Bật tự động: \`${prefix}chao on\` hoặc \`/chao on\`\n` +
                    `• Tắt tự động: \`${prefix}chao off\` hoặc \`/chao off\`\n` +
                    `• Gửi thử nghiệm: \`${prefix}chao test [7|11|18|22]\`\n` +
                    `• Đổi kênh gửi: \`${prefix}welcome set #kênh\``,
                inline: false
            }
        )
        .setFooter({ text: "Thời gian tính theo múi giờ Việt Nam (UTC+7)" })
        .setTimestamp();
}
