const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { setTroll, removeTroll, getTroll, listTrolls, clearTrolls } = require("../../utils/trollManager");
const { getPrefix, isAdmin } = require("../../utils/settings");

module.exports = {
    name: "troll",
    description: "Tự động thả icon cảm xúc mỗi khi thành viên được chỉ định nhắn tin",
    category: "Tiện ích",
    aliases: ["trollicon", "autofake", "thaicon"],
    cooldown: 3,
    permissions: 0, // Mọi người hoặc QTV server
    data: new SlashCommandBuilder()
        .setName("troll")
        .setDescription("Tự động thả icon cảm xúc mỗi khi người được chọn nhắn tin")
        .addSubcommand(sub =>
            sub.setName("set")
                .setDescription("Cài đặt icon troll tự động cho thành viên")
                .addStringOption(opt =>
                    opt.setName("emoji")
                        .setDescription("Icon / Emoji muốn thả (ví dụ: 🥀, 🤡, 💩)")
                        .setRequired(true)
                )
                .addUserOption(opt =>
                    opt.setName("user")
                        .setDescription("Thành viên bạn muốn bot thả icon mỗi khi nhắn")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName("off")
                .setDescription("Gỡ bỏ thả icon troll cho thành viên")
                .addUserOption(opt =>
                    opt.setName("user")
                        .setDescription("Thành viên muốn ngừng troll")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName("list")
                .setDescription("Xem danh sách thành viên đang bị troll trong máy chủ")
        )
        .addSubcommand(sub =>
            sub.setName("clear")
                .setDescription("Xóa toàn bộ danh sách troll trong máy chủ")
        ),

    async executeSlash(interaction, { client }) {
        if (!interaction.guild) {
            return interaction.reply({ content: "❌ Lệnh này chỉ dùng được trong máy chủ!", ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === "set") {
            const emoji = interaction.options.getString("emoji").trim();
            const targetUser = interaction.options.getUser("user");

            if (targetUser.id === client.user.id) {
                return interaction.reply({ content: "😤 Hổng được troll bot nha, bot dỗi đó!", ephemeral: true });
            }

            setTroll(guildId, targetUser.id, emoji);

            const embed = new EmbedBuilder()
                .setColor("#FF5555")
                .setTitle("🎭 ĐÃ KÍCH HOẠT TROLL ICON!")
                .setDescription(
                    `Từ giờ mỗi lần <@${targetUser.id}> nhắn bất kỳ tin nhắn nào trong máy chủ, bot sẽ tự động thả icon **${emoji}**!\n\n` +
                    `💡 *Dùng \`/troll off user:@${targetUser.username}\` để hủy bất kỳ lúc nào.*`
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === "off") {
            const targetUser = interaction.options.getUser("user");
            const success = removeTroll(guildId, targetUser.id);
            if (!success) {
                return interaction.reply({
                    content: `⚠️ Thành viên <@${targetUser.id}> hiện tại không có trong danh sách troll!`,
                    ephemeral: true
                });
            }
            return interaction.reply({
                content: `✅ Đã gỡ bỏ troll icon cho thành viên <@${targetUser.id}> thành công!`
            });
        }

        if (sub === "list") {
            const trolls = listTrolls(guildId);
            const userIds = Object.keys(trolls);

            if (userIds.length === 0) {
                return interaction.reply({
                    content: "🍃 Hiện tại không có thành viên nào đang bị troll icon trong máy chủ này!"
                });
            }

            const desc = userIds.map((uid, idx) => `**${idx + 1}.** <@${uid}> ➔ Icon: **${trolls[uid]}**`).join("\n");
            const embed = new EmbedBuilder()
                .setColor("#5865F2")
                .setTitle(`📋 DANH SÁCH TROLL ICON (${userIds.length})`)
                .setDescription(desc)
                .setFooter({ text: "Dùng /troll off để hủy troll thành viên" });

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === "clear") {
            clearTrolls(guildId);
            return interaction.reply({ content: "🧹 Đã xóa sạch toàn bộ danh sách troll trong máy chủ!" });
        }
    },

    async executePrefix(message, args, { client }) {
        if (!message.guild) {
            return message.reply("❌ Lệnh này chỉ dùng được trong máy chủ!");
        }

        const prefix = getPrefix(message.guild.id);
        const guildId = message.guild.id;

        if (!args.length) {
            return message.reply(
                `📖 **CÁCH DÙNG LỆNH TROLL ICON:**\n` +
                `• Thả icon tự động: \`${prefix}troll <icon> @username\` (Ví dụ: \`${prefix}troll 🥀 @annie\`)\n` +
                `• Tắt thả icon: \`${prefix}troll off @username\` hoặc \`${prefix}troll stop @username\`\n` +
                `• Xem danh sách: \`${prefix}troll list\`\n` +
                `• Xóa hết danh sách: \`${prefix}troll clear\``
            );
        }

        const action = args[0].toLowerCase();

        // 1. Xem danh sách
        if (action === "list" || action === "danhsach") {
            const trolls = listTrolls(guildId);
            const userIds = Object.keys(trolls);

            if (userIds.length === 0) {
                return message.reply("🍃 Hiện tại không có thành viên nào đang bị troll icon trong máy chủ này!");
            }

            const desc = userIds.map((uid, idx) => `**${idx + 1}.** <@${uid}> ➔ Icon: **${trolls[uid]}**`).join("\n");
            const embed = new EmbedBuilder()
                .setColor("#5865F2")
                .setTitle(`📋 DANH SÁCH TROLL ICON (${userIds.length})`)
                .setDescription(desc)
                .setFooter({ text: `Dùng ${prefix}troll off @user để gỡ troll` });

            return message.reply({ embeds: [embed] });
        }

        // 2. Xóa toàn bộ
        if (action === "clear" || action === "reset") {
            clearTrolls(guildId);
            return message.reply("🧹 Đã xóa sạch toàn bộ danh sách troll trong máy chủ!");
        }

        // 3. Tắt troll cho một người
        if (action === "off" || action === "stop" || action === "xoa" || action === "remove") {
            let targetUser = message.mentions.users.first();
            if (!targetUser && args[1]) {
                const id = args[1].replace(/[<@!>]/g, "");
                targetUser = await client.users.fetch(id).catch(() => null);
            }

            if (!targetUser) {
                return message.reply(`⚠️ Vui lòng tag thành viên muốn gỡ troll! Ví dụ: \`${prefix}troll off @username\``);
            }

            const success = removeTroll(guildId, targetUser.id);
            if (!success) {
                return message.reply(`⚠️ Thành viên <@${targetUser.id}> hiện tại không có trong danh sách troll!`);
            }
            return message.reply(`✅ Đã gỡ bỏ troll icon cho <@${targetUser.id}> thành công!`);
        }

        // 4. Cài đặt troll: !troll <icon> @user hoặc !troll @user <icon>
        let emoji = null;
        let targetUser = message.mentions.users.first();

        if (targetUser) {
            // Tìm emoji trong các đối số khác vị trí mention
            emoji = args.find(a => !a.includes(targetUser.id) && !a.startsWith("<@"));
        } else {
            // Người dùng có thể truyền ID dạng chuỗi
            if (args[1] && /^\d{17,20}$/.test(args[1])) {
                targetUser = await client.users.fetch(args[1]).catch(() => null);
                emoji = args[0];
            } else if (args[0] && /^\d{17,20}$/.test(args[0])) {
                targetUser = await client.users.fetch(args[0]).catch(() => null);
                emoji = args[1];
            }
        }

        if (!emoji || !targetUser) {
            return message.reply(
                `⚠️ Cú pháp không hợp lệ!\n` +
                `👉 Cách dùng: \`${prefix}troll <icon> @username\` (Ví dụ: \`${prefix}troll 🥀 @username\`)`
            );
        }

        if (targetUser.id === client.user.id) {
            return message.reply("😤 Hổng được troll bot nha, bot dỗi đó!");
        }

        setTroll(guildId, targetUser.id, emoji);

        const embed = new EmbedBuilder()
            .setColor("#FF5555")
            .setTitle("🎭 ĐÃ KÍCH HOẠT TROLL ICON!")
            .setDescription(
                `Từ giờ mỗi lần <@${targetUser.id}> nhắn bất kỳ tin nhắn nào trong máy chủ, bot sẽ tự động thả icon **${emoji}**!\n\n` +
                `💡 *Gõ \`${prefix}troll off @${targetUser.username}\` để hủy bất kỳ lúc nào.*`
            )
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};
