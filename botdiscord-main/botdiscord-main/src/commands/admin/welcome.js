const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder
} = require("discord.js");
const {
    getWelcomeConfig,
    setWelcomeConfig,
    getAutoGreetingConfig,
    setAutoGreetingConfig,
    getTimeGreetingConfig,
    setTimeGreetingConfig,
    getPrefix
} = require("../../utils/settings");
const { buildWelcomeEmbed, getWelcomeChannel } = require("../../utils/welcome");

module.exports = {
    name: "welcome",
    description: "Cấu hình hệ thống chào mừng thành viên mới và tự động chào hỏi",
    category: "Quản trị",
    aliases: ["setwelcome", "chaomung", "chao"],
    cooldown: 3,
    permissions: 1, // QTV server
    data: new SlashCommandBuilder()
        .setName("welcome")
        .setDescription("Quản lý hệ thống chào mừng thành viên mới")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub.setName("status")
                .setDescription("Xem cấu hình chào mừng hiện tại của máy chủ")
        )
        .addSubcommand(sub =>
            sub.setName("set")
                .setDescription("Cài đặt kênh gửi tin nhắn chào mừng thành viên mới")
                .addChannelOption(opt =>
                    opt.setName("channel")
                        .setDescription("Chọn kênh văn bản để bot gửi lời chào")
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName("on")
                .setDescription("Bật tính năng chào mừng thành viên mới")
        )
        .addSubcommand(sub =>
            sub.setName("off")
                .setDescription("Tắt tính năng chào mừng thành viên mới")
        )
        .addSubcommand(sub =>
            sub.setName("test")
                .setDescription("Gửi thử tin nhắn chào mừng mẫu để kiểm tra hiển thị")
        )
        .addSubcommand(sub =>
            sub.setName("message")
                .setDescription("Tùy chỉnh lời chào thành viên mới (nhập 'default' để về mặc định)")
                .addStringOption(opt =>
                    opt.setName("content")
                        .setDescription("Nội dung lời chào. Hỗ trợ: {user}, {username}, {server}, {memberCount}")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName("autogreet")
                .setDescription("Bật hoặc tắt tự động chào lại khi thành viên nhắn hi, chào, hello")
                .addStringOption(opt =>
                    opt.setName("status")
                        .setDescription("Chọn bật hoặc tắt")
                        .setRequired(true)
                        .addChoices(
                            { name: "Bật tự động chào", value: "on" },
                            { name: "Tắt tự động chào", value: "off" }
                        )
                )
        )
        .addSubcommand(sub =>
            sub.setName("chao")
                .setDescription("Bật hoặc tắt tự động chào theo giờ 7h, 11h, 18h, 22h")
                .addStringOption(opt =>
                    opt.setName("status")
                        .setDescription("Chọn bật hoặc tắt")
                        .setRequired(true)
                        .addChoices(
                            { name: "Bật chào theo giờ (7h-11h-18h-22h)", value: "on" },
                            { name: "Tắt chào theo giờ", value: "off" }
                        )
                )
        ),

    async executeSlash(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "❌ Lệnh này chỉ dùng trong máy chủ!", ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        // 1. Xem trạng thái
        if (sub === "status") {
            const prefix = getPrefix(guildId);
            const embed = buildStatusEmbed(interaction.guild, prefix);
            return interaction.reply({ embeds: [embed] });
        }

        // 2. Cài đặt kênh chào mừng
        if (sub === "set") {
            const targetChannel = interaction.options.getChannel("channel");
            setWelcomeConfig(guildId, { channelId: targetChannel.id, enabled: true });
            return interaction.reply({
                content: `✅ Đã đặt kênh chào mừng thành viên mới là: ${targetChannel} (\`${targetChannel.id}\`)!`
            });
        }

        // 3. Bật chào mừng
        if (sub === "on") {
            setWelcomeConfig(guildId, { enabled: true });
            return interaction.reply({
                content: "✅ Đã **BẬT** tính năng chào mừng thành viên mới!"
            });
        }

        // 4. Tắt chào mừng
        if (sub === "off") {
            setWelcomeConfig(guildId, { enabled: false });
            return interaction.reply({
                content: "🛑 Đã **TẮT** tính năng chào mừng thành viên mới!"
            });
        }

        // 5. Gửi thử nghiệm
        if (sub === "test") {
            const config = getWelcomeConfig(guildId);
            const targetChannel = getWelcomeChannel(interaction.guild, config.channelId) || interaction.channel;
            const payload = buildWelcomeEmbed(interaction.member, config.message);

            await targetChannel.send(payload);
            return interaction.reply({
                content: `✅ Đã gửi tin nhắn chào mừng thử nghiệm vào kênh: ${targetChannel}!`,
                ephemeral: true
            });
        }

        // 6. Cài đặt lời chào tùy chỉnh
        if (sub === "message") {
            const content = interaction.options.getString("content").trim();
            if (content.toLowerCase() === "default") {
                setWelcomeConfig(guildId, { message: null });
                return interaction.reply({ content: "✅ Đã đặt lại lời chào mừng về mặc định!" });
            }

            setWelcomeConfig(guildId, { message: content });
            return interaction.reply({
                content: `✅ Đã cập nhật lời chào mừng mới:\n>>> ${content}\n*(Hỗ trợ biến: \`{user}\`, \`{username}\`, \`{server}\`, \`{memberCount}\`)*`
            });
        }

        // 7. Bật / tắt tự động chào hi, hello
        if (sub === "autogreet") {
            const statusChoice = interaction.options.getString("status");
            const isEnabled = statusChoice === "on";
            setAutoGreetingConfig(guildId, isEnabled);
            return interaction.reply({
                content: isEnabled
                    ? "✅ Đã **BẬT** tính năng tự động chào lại khi thành viên nhắn `hi`, `chào`, `hello`!"
                    : "🛑 Đã **TẮT** tính năng tự động chào lại khi thành viên nhắn `hi`, `chào`, `hello`!"
            });
        }

        // 8. Bật / tắt tự động chào theo giờ 7h-11h-18h-22h
        if (sub === "chao") {
            const statusChoice = interaction.options.getString("status");
            const isEnabled = statusChoice === "on";
            setTimeGreetingConfig(guildId, isEnabled);
            return interaction.reply({
                content: isEnabled
                    ? "✅ Đã **BẬT** tự động gửi lời chào theo giờ: **7H (Sáng), 11H (Trưa), 18H (Tối), 22H (Đêm)**!"
                    : "🛑 Đã **TẮT** tự động gửi lời chào theo giờ 7H-11H-18H-22H!"
            });
        }
    },

    async executePrefix(message, args) {
        if (!message.guild) return message.reply("❌ Lệnh này chỉ dùng trong máy chủ!");

        const prefix = getPrefix(message.guildId);
        const action = args[0]?.toLowerCase();

        // 1. Bảng trạng thái & Hướng dẫn khi không truyền tham số hoặc gõ status
        if (!action || action === "status") {
            const embed = buildStatusEmbed(message.guild, prefix);
            return message.reply({ embeds: [embed] });
        }

        // 2. Cài đặt kênh: !welcome set [#channel]
        if (action === "set") {
            const targetChannel = message.mentions.channels.first() ||
                message.guild.channels.cache.get(args[1]) ||
                message.channel;

            if (!targetChannel || !targetChannel.isTextBased()) {
                return message.reply("⚠️ Vui lòng tag một kênh văn bản hợp lệ! Ví dụ: `" + prefix + "welcome set #chao-mung`");
            }

            setWelcomeConfig(message.guildId, { channelId: targetChannel.id, enabled: true });
            return message.reply(`✅ Đã đặt kênh chào mừng thành viên mới là: ${targetChannel} (\`${targetChannel.id}\`)!`);
        }

        // 3. Bật chào mừng: !welcome on / bat
        if (action === "on" || action === "bat") {
            setWelcomeConfig(message.guildId, { enabled: true });
            return message.reply("✅ Đã **BẬT** tính năng chào mừng thành viên mới!");
        }

        // 4. Tắt chào mừng: !welcome off / tat
        if (action === "off" || action === "tat") {
            setWelcomeConfig(message.guildId, { enabled: false });
            return message.reply("🛑 Đã **TẮT** tính năng chào mừng thành viên mới!");
        }

        // 5. Gửi thử nghiệm: !welcome test
        if (action === "test") {
            const config = getWelcomeConfig(message.guildId);
            const targetChannel = getWelcomeChannel(message.guild, config.channelId) || message.channel;
            const payload = buildWelcomeEmbed(message.member, config.message);

            await targetChannel.send(payload);
            return message.reply(`✅ Đã gửi tin nhắn chào mừng thử nghiệm vào kênh: ${targetChannel}!`);
        }

        // 6. Tùy chỉnh lời chào: !welcome message <nội dung>
        if (action === "message" || action === "msg") {
            const content = args.slice(1).join(" ").trim();
            if (!content) {
                return message.reply(
                    `⚠️ Vui lòng nhập nội dung lời chào!\n` +
                    `• Ví dụ: \`${prefix}welcome message Chào mừng {user} đã đến với {server}! 🎉\`\n` +
                    `• Nhập: \`${prefix}welcome message default\` để khôi phục mặc định.`
                );
            }

            if (content.toLowerCase() === "default") {
                setWelcomeConfig(message.guildId, { message: null });
                return message.reply("✅ Đã đặt lại lời chào mừng về mặc định!");
            }

            setWelcomeConfig(message.guildId, { message: content });
            return message.reply(
                `✅ Đã cập nhật lời chào mừng mới:\n>>> ${content}\n*(Hỗ trợ biến: \`{user}\`, \`{username}\`, \`{server}\`, \`{memberCount}\`)*`
            );
        }

        // 7. Bật / tắt auto greeting: !welcome autogreet on/off
        if (action === "autogreet") {
            const statusChoice = args[1]?.toLowerCase();
            if (statusChoice === "on" || statusChoice === "bat") {
                setAutoGreetingConfig(message.guildId, true);
                return message.reply("✅ Đã **BẬT** tự động chào lại khi thành viên nhắn `hi`, `chào`, `hello`!");
            } else if (statusChoice === "off" || statusChoice === "tat") {
                setAutoGreetingConfig(message.guildId, false);
                return message.reply("🛑 Đã **TẮT** tự động chào lại khi thành viên nhắn `hi`, `chào`, `hello`!");
            } else {
                return message.reply(`⚠️ Cách dùng: \`${prefix}welcome autogreet on\` hoặc \`${prefix}welcome autogreet off\``);
            }
        }

        // 8. Bật / tắt chào theo giờ: !welcome chao on/off
        if (action === "chao" || action === "time") {
            const statusChoice = args[1]?.toLowerCase();
            if (statusChoice === "on" || statusChoice === "bat") {
                setTimeGreetingConfig(message.guildId, true);
                return message.reply("✅ Đã **BẬT** tự động gửi lời chào theo giờ: **7H (Sáng), 11H (Trưa), 18H (Tối), 22H (Đêm)**!");
            } else if (statusChoice === "off" || statusChoice === "tat") {
                setTimeGreetingConfig(message.guildId, false);
                return message.reply("🛑 Đã **TẮT** tự động gửi lời chào theo giờ 7H-11H-18H-22H!");
            } else {
                return message.reply(`⚠️ Cách dùng: \`${prefix}welcome chao on\` hoặc \`${prefix}welcome chao off\``);
            }
        }

        // Lệnh không hợp lệ
        return message.reply(
            `⚠️ Tùy chọn không hợp lệ! Gõ \`${prefix}welcome\` để xem bảng hướng dẫn chi tiết.`
        );
    }
};

/**
 * Tạo Embed hiển thị bảng trạng thái cấu hình Welcome
 */
function buildStatusEmbed(guild, prefix) {
    const welcomeConfig = getWelcomeConfig(guild.id);
    const isAutoGreet = getAutoGreetingConfig(guild.id);
    const isTimeGreet = getTimeGreetingConfig(guild.id);

    const channelText = welcomeConfig.channelId
        ? `<#${welcomeConfig.channelId}> (\`${welcomeConfig.channelId}\`)`
        : `Chưa đặt (Tự động gửi vào kênh hệ thống / kênh đầu tiên)`;

    const welcomeStatus = welcomeConfig.enabled
        ? "🟢 **Đang BẬT**"
        : "🔴 **Đang TẮT**";

    const autoGreetStatus = isAutoGreet
        ? "🟢 **Đang BẬT**"
        : "🔴 **Đang TẮT**";

    const timeGreetStatus = isTimeGreet
        ? "🟢 **Đang BẬT**"
        : "🔴 **Đang TẮT**";

    const customMsg = welcomeConfig.message
        ? `>>> ${welcomeConfig.message}`
        : "*(Sử dụng lời chào mặc định)*";

    return new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🎉 CẤU HÌNH HỆ THỐNG CHÀO MỪNG MÁY CHỦ")
        .setDescription(
            `Quản lý tin nhắn chào đón thành viên mới, tự động chào hỏi và lời chúc 4 khung giờ cho máy chủ **${guild.name}**.`
        )
        .addFields(
            { name: "📢 Kênh chào mừng", value: channelText, inline: false },
            { name: "⚙️ Chào thành viên mới", value: welcomeStatus, inline: true },
            { name: "💬 Chào lại (hi/chào/hello)", value: autoGreetStatus, inline: true },
            { name: "⏰ Chào 7h-11h-18h-22h", value: timeGreetStatus, inline: true },
            { name: "📝 Lời chào tùy chỉnh", value: customMsg, inline: false },
            {
                name: "💡 Các biến hỗ trợ",
                value: "`{user}`: Tag thành viên\n`{username}`: Tên người dùng\n`{server}`: Tên máy chủ\n`{memberCount}`: Số thứ tự thành viên",
                inline: false
            },
            {
                name: "🛠️ Hướng dẫn lệnh thiết lập",
                value:
                    `• Đặt kênh: \`${prefix}welcome set #kênh\` hoặc \`/welcome set\`\n` +
                    `• Bật / Tắt chào mới: \`${prefix}welcome on\` / \`${prefix}welcome off\`\n` +
                    `• Gửi thử: \`${prefix}welcome test\`\n` +
                    `• Đổi lời chào: \`${prefix}welcome message <nội dung>\`\n` +
                    `• Chào 7h-11h-18h-22h: \`${prefix}welcome chao on/off\` hoặc \`${prefix}chao on/off\`\n` +
                    `• Đổi tự động chào (hi/hello): \`${prefix}welcome autogreet on/off\``,
                inline: false
            }
        )
        .setFooter({ text: `Máy chủ: ${guild.name} • Yêu cầu quyền QTV Server` })
        .setTimestamp();
}

