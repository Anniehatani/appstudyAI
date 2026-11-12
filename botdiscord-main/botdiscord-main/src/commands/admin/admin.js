const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getSettings, saveSettings, getAdmins, getNDH, isAdmin } = require("../../utils/settings");

module.exports = {
    name: "admin",
    description: "Quản lý và cấu hình ADMIN BOT, NGƯỜI HỖ TRỢ (NDH) và chế độ hoạt động",
    category: "Quản trị",
    aliases: ["ad"],
    cooldown: 3,
    permissions: 2, // Chỉ NDH hoặc Admin mới được chạy lệnh này
    data: new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Quản lý danh sách ADMIN BOT và NDH")
        .addSubcommand(sub =>
            sub.setName("list")
                .setDescription("Xem danh sách ADMIN BOT và NGƯỜI HỖ TRỢ")
        )
        .addSubcommand(sub =>
            sub.setName("add")
                .setDescription("Thêm ADMIN BOT mới")
                .addUserOption(opt => opt.setName("user").setDescription("Chọn người dùng Discord").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("remove")
                .setDescription("Gỡ ADMIN BOT")
                .addUserOption(opt => opt.setName("user").setDescription("Chọn người dùng Discord").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("addndh")
                .setDescription("Thêm Người hỗ trợ (NDH)")
                .addUserOption(opt => opt.setName("user").setDescription("Chọn người dùng Discord").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("removendh")
                .setDescription("Gỡ Người hỗ trợ (NDH)")
                .addUserOption(opt => opt.setName("user").setDescription("Chọn người dùng Discord").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("only")
                .setDescription("Bật/tắt chế độ chỉ Admin Bot mới được dùng bot")
        )
        .addSubcommand(sub =>
            sub.setName("qtvonly")
                .setDescription("Bật/tắt chế độ chỉ Quản trị viên server (QTV) mới được dùng bot")
        ),

    async executeSlash(interaction, { client }) {
        const sub = interaction.options.getSubcommand();
        const settings = getSettings();
        const authorId = interaction.user.id;

        // Xử lý xem danh sách
        if (sub === "list") {
            const embed = await buildAdminListEmbed(client);
            return interaction.reply({ embeds: [embed] });
        }

        // Các hành động thay đổi quyền yêu cầu ADMIN BOT (Level 3)
        if (!isAdmin(authorId) && authorId !== interaction.guild?.ownerId) {
            return interaction.reply({ content: "⛔ Chỉ có ADMIN BOT mới có quyền thực hiện thao tác này!", ephemeral: true });
        }

        const targetUser = interaction.options.getUser("user");
        if (sub === "add") {
            if (!settings.admins) settings.admins = [];
            if (settings.admins.includes(targetUser.id)) {
                return interaction.reply({ content: `⚠️ Người dùng **${targetUser.tag}** đã là ADMIN BOT từ trước!`, ephemeral: true });
            }
            settings.admins.push(targetUser.id);
            saveSettings(settings);
            return interaction.reply({ content: `✅ Đã thêm **${targetUser.tag}** (\`${targetUser.id}\`) làm **ADMIN BOT**!` });
        }

        if (sub === "remove") {
            if (!settings.admins || !settings.admins.includes(targetUser.id)) {
                return interaction.reply({ content: `⚠️ Người dùng **${targetUser.tag}** không có trong danh sách admin!`, ephemeral: true });
            }
            settings.admins = settings.admins.filter(id => id !== targetUser.id);
            saveSettings(settings);
            return interaction.reply({ content: `✅ Đã gỡ quyền **ADMIN BOT** của **${targetUser.tag}**!` });
        }

        if (sub === "addndh") {
            if (!settings.ndh) settings.ndh = [];
            if (settings.ndh.includes(targetUser.id)) {
                return interaction.reply({ content: `⚠️ Người dùng **${targetUser.tag}** đã là NGƯỜI HỖ TRỢ!`, ephemeral: true });
            }
            settings.ndh.push(targetUser.id);
            saveSettings(settings);
            return interaction.reply({ content: `✅ Đã thêm **${targetUser.tag}** (\`${targetUser.id}\`) làm **NGƯỜI HỖ TRỢ (NDH)**!` });
        }

        if (sub === "removendh") {
            if (!settings.ndh || !settings.ndh.includes(targetUser.id)) {
                return interaction.reply({ content: `⚠️ Người dùng **${targetUser.tag}** không có trong danh sách hỗ trợ!`, ephemeral: true });
            }
            settings.ndh = settings.ndh.filter(id => id !== targetUser.id);
            saveSettings(settings);
            return interaction.reply({ content: `✅ Đã gỡ quyền **NGƯỜI HỖ TRỢ** của **${targetUser.tag}**!` });
        }

        if (sub === "only") {
            settings.adminOnly = !settings.adminOnly;
            saveSettings(settings);
            return interaction.reply({ content: `🔔 Chế độ **Admin Only** đã được: **${settings.adminOnly ? "BẬT (Chỉ Admin dùng bot)" : "TẮT (Mọi người đều dùng được)"}**!` });
        }

        if (sub === "qtvonly") {
            settings.qtvOnly = !settings.qtvOnly;
            saveSettings(settings);
            return interaction.reply({ content: `🔔 Chế độ **QTV Only** đã được: **${settings.qtvOnly ? "BẬT (Chỉ QTV/Admin dùng bot)" : "TẮT"}**!` });
        }
    },

    async executePrefix(message, args, { client }) {
        const sub = args[0]?.toLowerCase();
        const settings = getSettings();
        const authorId = message.author.id;

        if (!sub || sub === "list") {
            const embed = await buildAdminListEmbed(client);
            return message.reply({ embeds: [embed] });
        }

        // Kiểm tra quyền Admin Bot
        if (!isAdmin(authorId) && authorId !== message.guild?.ownerId) {
            return message.reply("⛔ Bạn cần là **ADMIN BOT** để sử dụng tính năng quản lý quyền này!");
        }

        if (sub === "only") {
            settings.adminOnly = !settings.adminOnly;
            saveSettings(settings);
            return message.reply(`🔔 Chế độ **Admin Only** đã được: **${settings.adminOnly ? "BẬT" : "TẮT"}**!`);
        }

        if (sub === "qtvonly") {
            settings.qtvOnly = !settings.qtvOnly;
            saveSettings(settings);
            return message.reply(`🔔 Chế độ **QTV Only** đã được: **${settings.qtvOnly ? "BẬT" : "TẮT"}**!`);
        }

        let targetUser = message.mentions.users.first();
        const targetId = targetUser?.id || (args[1] && /^\d+$/.test(args[1]) ? args[1] : null);

        if (!targetId) {
            return message.reply("⚠️ Vui lòng tag @User hoặc nhập ID người dùng!");
        }

        if (!targetUser) {
            targetUser = await client.users.fetch(targetId).catch(() => null);
        }
        const userTag = targetUser ? targetUser.tag : targetId;

        if (sub === "add") {
            if (!settings.admins) settings.admins = [];
            if (settings.admins.includes(targetId)) return message.reply(`⚠️ **${userTag}** đã là ADMIN BOT!`);
            settings.admins.push(targetId);
            saveSettings(settings);
            return message.reply(`✅ Đã thêm **${userTag}** làm **ADMIN BOT**!`);
        }

        if (sub === "remove") {
            if (!settings.admins || !settings.admins.includes(targetId)) return message.reply(`⚠️ **${userTag}** không nằm trong danh sách admin!`);
            settings.admins = settings.admins.filter(id => id !== targetId);
            saveSettings(settings);
            return message.reply(`✅ Đã gỡ quyền **ADMIN BOT** của **${userTag}**!`);
        }

        if (sub === "addndh") {
            if (!settings.ndh) settings.ndh = [];
            if (settings.ndh.includes(targetId)) return message.reply(`⚠️ **${userTag}** đã là NGƯỜI HỖ TRỢ!`);
            settings.ndh.push(targetId);
            saveSettings(settings);
            return message.reply(`✅ Đã thêm **${userTag}** làm **NGƯỜI HỖ TRỢ (NDH)**!`);
        }

        if (sub === "removendh") {
            if (!settings.ndh || !settings.ndh.includes(targetId)) return message.reply(`⚠️ **${userTag}** không nằm trong danh sách hỗ trợ!`);
            settings.ndh = settings.ndh.filter(id => id !== targetId);
            saveSettings(settings);
            return message.reply(`✅ Đã gỡ quyền **NGƯỜI HỖ TRỢ** của **${userTag}**!`);
        }

        message.reply("⚠️ Lệnh không hợp lệ! Dùng: `list`, `add`, `remove`, `addndh`, `removendh`, `only`, `qtvonly`");
    }
};

async function buildAdminListEmbed(client) {
    const adminIds = getAdmins();
    const ndhIds = getNDH();
    const settings = getSettings();

    const fetchNames = async (ids) => {
        if (!ids.length) return "*(Chưa có ai)*";
        const results = [];
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const user = await client.users.fetch(id).catch(() => null);
            const name = user ? user.tag : `ID: ${id}`;
            results.push(`**${i + 1}.** ${name} (\`${id}\`)`);
        }
        return results.join("\n");
    };

    const adminText = await fetchNames(adminIds);
    const ndhText = await fetchNames(ndhIds);

    return new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle("👑 DANH SÁCH BAN QUẢN TRỊ BOT")
        .addFields(
            { name: "🛡️ ADMIN BOT", value: adminText, inline: false },
            { name: "🤝 NGƯỜI HỖ TRỢ (NDH)", value: ndhText, inline: false },
            { name: "⚙️ Trạng thái chế độ", value: `• Admin Only: **${settings.adminOnly ? "BẬT" : "TẮT"}**\n• QTV Only: **${settings.qtvOnly ? "BẬT" : "TẮT"}**`, inline: false }
        )
        .setFooter({ text: "Sử dụng /admin help hoặc !admin để xem hướng dẫn" })
        .setTimestamp();
}
