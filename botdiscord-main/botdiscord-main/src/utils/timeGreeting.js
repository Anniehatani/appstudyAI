const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const moment = require("moment-timezone");
const chalk = require("chalk");
const { getTimeGreetingConfig, getWelcomeConfig } = require("./settings");
const { getWelcomeChannel } = require("./welcome");

// Lưu vết các mốc giờ đã gửi để tránh gửi lặp lại trong cùng một ngày: Map<"guildId_YYYY-MM-DD_hour", boolean>
const sentGreetingRecords = new Map();

/**
 * Định nghĩa thông điệp cho 4 mốc giờ: 7h (Sáng), 11h (Trưa), 18h (Tối), 22h (Đêm)
 */
const TIME_GREETINGS = {
    7: {
        timeName: "Buổi Sáng (07:00)",
        title: "🌅 CHÀO BUỔI SÁNG TƯƠI ĐẸP! ☀️",
        color: "#FFA500", // Cam vàng bình minh
        thumbnail: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
        message:
            "Chào buổi sáng cả nhà! ☀️ Chúc toàn thể thành viên máy chủ một ngày mới tràn ngập niềm vui, may mắn, học tập và làm việc thật hiệu quả nhé! 🍀\n\n" +
            "☕🥪 Đừng quên ăn sáng và nạp năng lượng đầy đủ cho một ngày dài năng động nha!"
    },
    11: {
        timeName: "Buổi Trưa (11:00)",
        title: "☀️ CHÀO BUỔI TRƯA NGHỈ NGƠI! 🍱",
        color: "#00D26A", // Xanh ngọc tươi mát
        thumbnail: "https://cdn-icons-png.flaticon.com/512/3222/3222800.png",
        message:
            "Chào buổi trưa mọi người! 🍱 Một buổi sáng bận rộn đã qua rồi, đến giờ nạp năng lượng và nghỉ trưa rồi cả nhà ơi!\n\n" +
            "🍲 Chúc mọi người có bữa trưa thật ngon miệng và dành thời gian chợp mắt một chút để lấy lại năng lượng nhé! 🍵✨"
    },
    18: {
        timeName: "Buổi Tối (18:00)",
        title: "🌇 CHÀO BUỔI TỐI ẤM ÁP! 🍲",
        color: "#FF6B6B", // Hoàng hôn ấm áp
        thumbnail: "https://cdn-icons-png.flaticon.com/512/3222/3222791.png",
        message:
            "Chào buổi tối cả nhà! 🍲 Sau một ngày dài học tập và làm việc vất vả, hãy tạm gác lại mọi âu lo để về nhà tắm rửa và quây quần bên mâm cơm ấm áp nhé!\n\n" +
            "💖 Annie chúc mọi người có một buổi tối thật vui vẻ, thư giãn và tràn ngập tiếng cười bên những người thân yêu!"
    },
    22: {
        timeName: "Ban Đêm / Chúc Ngủ Ngon (22:00)",
        title: "🌙 CHÚC CẢ NHÀ NGỦ THẬT NGON! 💤",
        color: "#5865F2", // Xanh tím màn đêm
        thumbnail: "https://cdn-icons-png.flaticon.com/512/3222/3222797.png",
        message:
            "Đã 22h đêm rồi cả nhà ơi! 😴 Hãy cho đôi mắt và cơ thể được nghỉ ngơi sau một ngày dài nhé.\n\n" +
            "✨ Annie chúc toàn thể thành viên máy chủ ngủ thật ngon, có những giấc mơ thật đẹp và thức dậy với tinh thần thật sảng khoái vào ngày mai! 💤💖"
    }
};

/**
 * Tạo Embed chào theo mốc giờ
 */
function buildTimeGreetingEmbed(hour, guild) {
    const greetingData = TIME_GREETINGS[hour] || TIME_GREETINGS[7];
    const nowStr = moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

    return new EmbedBuilder()
        .setColor(greetingData.color)
        .setAuthor({
            name: `${guild.name} • Lời Chúc Tự Động`,
            iconURL: guild.iconURL({ dynamic: true }) || undefined
        })
        .setTitle(greetingData.title)
        .setDescription(greetingData.message)
        .setThumbnail(greetingData.thumbnail)
        .setFooter({ text: `Khung giờ: ${greetingData.timeName} • Giờ Việt Nam` })
        .setTimestamp();
}

/**
 * Gửi tin nhắn chào theo giờ cho 1 guild cụ thể
 */
async function sendGreetingToGuild(guild, hour) {
    if (!guild) return false;

    // Kiểm tra xem guild có bật tính năng này không
    const isEnabled = getTimeGreetingConfig(guild.id);
    if (!isEnabled) return false;

    const welcomeConfig = getWelcomeConfig(guild.id);
    const channel = getWelcomeChannel(guild, welcomeConfig.channelId);

    if (!channel) return false;

    // Kiểm tra quyền
    const botPerms = channel.permissionsFor(guild.members.me);
    if (!botPerms || !botPerms.has(PermissionFlagsBits.SendMessages) || !botPerms.has(PermissionFlagsBits.EmbedLinks)) {
        return false;
    }

    try {
        const embed = buildTimeGreetingEmbed(hour, guild);
        await channel.send({ embeds: [embed] });

        const timeStr = moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");
        console.log(
            chalk.gray(`[ ${timeStr} ] `) +
            chalk.magenta(`[ CHÀO THEO GIỜ: ${hour}H ] `) +
            chalk.cyan(`[${guild.name}] `) +
            chalk.white(`Đã gửi lời chào tới #${channel.name}`)
        );
        return true;
    } catch (err) {
        console.error(chalk.red(`[ LỖI CHÀO THEO GIỜ ${guild.name} ]`), err.message);
        return false;
    }
}

/**
 * Kiểm tra định kỳ và gửi lời chào theo khung giờ 7, 11, 18, 22
 */
async function checkAndSendPeriodicGreetings(client) {
    if (!client || !client.isReady()) return;

    const now = moment().tz("Asia/Ho_Chi_Minh");
    const currentHour = now.hour();
    const currentMinute = now.minute();
    const todayStr = now.format("YYYY-MM-DD");

    // Chỉ thực hiện ở các khung giờ: 7h, 11h, 18h, 22h trong 10 phút đầu của mốc giờ
    const targetHours = [7, 11, 18, 22];
    if (!targetHours.includes(currentHour) || currentMinute > 10) {
        return;
    }

    for (const guild of client.guilds.cache.values()) {
        const recordKey = `${guild.id}_${todayStr}_${currentHour}`;

        // Nếu hôm nay mốc giờ này chưa gửi thì gửi
        if (!sentGreetingRecords.has(recordKey)) {
            const sent = await sendGreetingToGuild(guild, currentHour);
            if (sent) {
                sentGreetingRecords.set(recordKey, true);
            }
        }
    }

    // Dọn dẹp cache cũ hơn 2 ngày
    if (sentGreetingRecords.size > 200) {
        sentGreetingRecords.clear();
    }
}

/**
 * Khởi động bộ đếm thời gian kiểm tra định kỳ mỗi 30 giây
 */
function startTimeGreetingScheduler(client) {
    // Chạy kiểm tra mỗi 30 giây
    setInterval(() => {
        checkAndSendPeriodicGreetings(client).catch(err => {
            console.error(chalk.red("[ LỖI SCHEDULER CHÀO THEO GIỜ ]"), err.message);
        });
    }, 30 * 1000);
}

module.exports = {
    TIME_GREETINGS,
    buildTimeGreetingEmbed,
    sendGreetingToGuild,
    checkAndSendPeriodicGreetings,
    startTimeGreetingScheduler
};
