const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const moment = require("moment-timezone");
const chalk = require("chalk");
const { getWelcomeConfig } = require("./settings");

function formatTime(date) {
    if (!date) return "Không xác định";
    return moment(date).tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
}

/**
 * Tạo Embed chào mừng thành viên mới
 */
function buildWelcomeEmbed(member, customMessage = null) {
    const guild = member.guild;
    const user = member.user;
    const createdAt = formatTime(user.createdAt);
    const joinedAt = formatTime(member.joinedAt || new Date());

    // Nội dung mô tả tùy chỉnh hoặc mặc định
    let descriptionText;
    if (customMessage && customMessage.trim()) {
        descriptionText = customMessage
            .replace(/{user}/g, `${member}`)
            .replace(/{username}/g, user.username)
            .replace(/{tag}/g, user.tag)
            .replace(/{server}/g, guild.name)
            .replace(/{memberCount}/g, String(guild.memberCount));
    } else {
        descriptionText =
            `✨ Xin chào ${member}, chào mừng bạn đã gia nhập đại gia đình **${guild.name}**!\n` +
            `Chúc bạn có những phút giây giao lưu, trò chuyện thật vui vẻ và thoải mái nhé! 💖`;
    }

    const embed = new EmbedBuilder()
        .setColor("#00D26A")
        .setAuthor({
            name: `Chào mừng bạn đến với ${guild.name}! 🎉`,
            iconURL: guild.iconURL({ dynamic: true }) || undefined
        })
        .setTitle("✨ THÀNH VIÊN MỚI THAM GIA ✨")
        .setDescription(descriptionText)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
            { name: "👤 Người dùng", value: `${user.tag} (${member})`, inline: true },
            { name: "🆔 ID", value: `\`${user.id}\``, inline: true },
            { name: "📊 Thứ tự thành viên", value: `\`#${guild.memberCount}\``, inline: true },
            { name: "📅 Ngày tạo tài khoản", value: createdAt, inline: true },
            { name: "⏰ Thời gian gia nhập", value: joinedAt, inline: true },
            { name: "📌 Lưu ý", value: "Đừng quên đọc kỹ quy định máy chủ và nhận role để bắt đầu trò chuyện nhé!", inline: false }
        )
        .setFooter({
            text: `ID Người dùng: ${user.id} • ${guild.name}`,
            iconURL: user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

    return {
        content: `👋 Chào mừng ${member} đã tham gia máy chủ **${guild.name}**!`,
        embeds: [embed]
    };
}

/**
 * Tìm kênh hợp lệ để gửi tin nhắn chào mừng
 */
function getWelcomeChannel(guild, channelId) {
    if (!guild) return null;

    // 1. Kiểm tra kênh đã cài đặt
    if (channelId) {
        const configuredChannel = guild.channels.cache.get(channelId);
        if (configuredChannel && configuredChannel.isTextBased()) {
            return configuredChannel;
        }
    }

    // 2. Fallback sang systemChannel của server
    if (guild.systemChannel && guild.systemChannel.isTextBased()) {
        const perms = guild.systemChannel.permissionsFor(guild.members.me);
        if (perms?.has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ViewChannel])) {
            return guild.systemChannel;
        }
    }

    // 3. Fallback sang kênh text đầu tiên có quyền gửi tin
    const firstWritableChannel = guild.channels.cache.find(c =>
        c.isTextBased() &&
        c.permissionsFor(guild.members.me)?.has([
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.EmbedLinks
        ])
    );

    return firstWritableChannel || null;
}

/**
 * Xử lý khi thành viên mới tham gia server
 */
async function handleMemberJoin(member) {
    if (!member || !member.guild) return;
    if (member.user?.bot) return; // Bỏ qua bot

    const config = getWelcomeConfig(member.guild.id);
    if (!config.enabled) return;

    const channel = getWelcomeChannel(member.guild, config.channelId);
    if (!channel) {
        console.warn(chalk.yellow(`[ WELCOME WARN ] Không tìm thấy kênh phù hợp để gửi lời chào mừng tại máy chủ: ${member.guild.name}`));
        return;
    }

    // Kiểm tra quyền của bot trong kênh
    const botPerms = channel.permissionsFor(member.guild.members.me);
    if (!botPerms || !botPerms.has(PermissionFlagsBits.SendMessages) || !botPerms.has(PermissionFlagsBits.EmbedLinks)) {
        console.warn(chalk.yellow(`[ WELCOME WARN ] Bot thiếu quyền SendMessages/EmbedLinks tại kênh #${channel.name} (${channel.id})`));
        return;
    }

    try {
        const payload = buildWelcomeEmbed(member, config.message);
        await channel.send(payload);

        const time = moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");
        console.log(
            chalk.gray(`[ ${time} ] `) +
            chalk.green(`[ THÀNH VIÊN MỚI ] `) +
            chalk.cyan(`[${member.guild.name}] `) +
            chalk.white(`${member.user.tag} (Thành viên thứ #${member.guild.memberCount})`)
        );
    } catch (err) {
        console.error(chalk.red(`[ LỖI GỬI LỜI CHÀO MỪNG: ${member.guild.name} ]`), err.message);
    }
}

module.exports = {
    buildWelcomeEmbed,
    getWelcomeChannel,
    handleMemberJoin
};
