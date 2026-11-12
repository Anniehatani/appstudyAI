/**
 * ANNIE DISCORD BOT - PHIÊN BẢN TINH GIẢN & THUẦN DISCORD (DISCORD.JS V14)
 * Hỗ trợ Slash Commands (/) & Prefix Commands (!)
 */
require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    Partials,
    REST,
    Routes,
    Collection,
    ActivityType,
    EmbedBuilder,
    Events
} = require("discord.js");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const moment = require("moment-timezone");

const { getConfig, getSettings, getPrefix, checkPermission, isAdmin } = require("./src/utils/settings");
const logger = require("./utils/log");
const { handlePrefixOnly, handleWrongCommand } = require("./src/commands/general/sailenh");
const { handleMemberJoin } = require("./src/utils/welcome");
const { handleAutoGreeting } = require("./src/utils/autoGreeting");
const { startTimeGreetingScheduler } = require("./src/utils/timeGreeting");
const { handleBotChat } = require("./src/utils/beAnhAI");
const { handleTrollReaction } = require("./src/utils/trollManager");

function getTime() {
    return moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
}

function getTimestamp() {
    return moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");
}

// 1. Tải cấu hình
const config = getConfig();
const BOT_TOKEN = process.env.DISCORD_TOKEN || config.DISCORD?.TOKEN;
let CLIENT_ID = process.env.DISCORD_CLIENT_ID || config.DISCORD?.CLIENT_ID;

if (!BOT_TOKEN || BOT_TOKEN.includes("DÁN_TOKEN") || BOT_TOKEN.length < 20) {
    console.log(chalk.bold.red("\n[ CẢNH BÁO ] Chưa cấu hình Discord Bot Token!"));
    console.log(chalk.yellow("👉 Vui lòng mở file config.json hoặc .env để điền DISCORD_TOKEN.\n"));
    process.exit(1);
}

// Tự động phân tích CLIENT_ID từ BOT_TOKEN nếu chưa có
if (!CLIENT_ID && BOT_TOKEN.includes(".")) {
    try {
        const decoded = Buffer.from(BOT_TOKEN.split(".")[0], "base64").toString("utf8");
        if (/^\d+$/.test(decoded)) CLIENT_ID = decoded;
    } catch (e) {}
}

// 2. Khởi tạo Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember
    ]
});

client.commands = new Collection();
client.aliases = new Collection();
client.cooldowns = new Collection();

// 3. Tải các lệnh (Commands Loader)
const slashCommandsList = [];
const commandsDir = path.join(__dirname, "src", "commands");

function loadCommands(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            loadCommands(fullPath);
        } else if (file.endsWith(".js")) {
            try {
                const command = require(fullPath);
                if (!command.name) continue;

                client.commands.set(command.name.toLowerCase(), command);

                // Nạp Aliases
                if (Array.isArray(command.aliases)) {
                    for (const alias of command.aliases) {
                        client.aliases.set(alias.toLowerCase(), command.name.toLowerCase());
                    }
                }

                // Thu thập Slash Command Builder
                if (command.data && typeof command.data.toJSON === "function") {
                    slashCommandsList.push(command.data.toJSON());
                }
            } catch (err) {
                console.error(chalk.red(`[ LỖI NẠP LỆNH: ${file} ]`), err.message);
            }
        }
    }
}

if (fs.existsSync(commandsDir)) {
    loadCommands(commandsDir);
}

// 4. Sự kiện khi Bot kết nối thành công (Ready)
client.once(Events.ClientReady, async () => {
    const defaultPrefix = config.DISCORD?.PREFIX || config.PREFIX || "!";
    const startTime = getTime();

    console.log(chalk.bold.cyan(`\n╔═══════════════════════════════════════════════════════════╗`));
    console.log(chalk.bold.cyan(`║              ANNIE DISCORD BOT ĐÃ ONLINE                  ║`));
    console.log(chalk.bold.cyan(`╠═══════════════════════════════════════════════════════════╣`));
    console.log(chalk.bold.green(`║  🤖 Tên Bot    : ${client.user.tag.padEnd(41)}║`));
    console.log(chalk.bold.green(`║  🆔 ID Bot     : ${client.user.id.padEnd(41)}║`));
    console.log(chalk.bold.green(`║  ⚡ Tiền tố    : ${defaultPrefix.padEnd(41)}║`));
    console.log(chalk.bold.green(`║  📦 Tổng lệnh  : ${String(client.commands.size).padEnd(41)}║`));
    console.log(chalk.bold.green(`║  🌐 Máy chủ    : ${String(client.guilds.cache.size).padEnd(41)}║`));
    console.log(chalk.bold.green(`║  👥 Người dùng : ${String(client.users.cache.size).padEnd(41)}║`));
    console.log(chalk.bold.green(`║  ⏰ Khởi động  : ${startTime.padEnd(41)}║`));
    console.log(chalk.bold.cyan(`╚═══════════════════════════════════════════════════════════╝`));
    console.log(chalk.bold.magenta(`[ ${startTime} ] 🎧 [ LẮNG NGHE ] Bot đang lắng nghe tin nhắn & tương tác lệnh...\n`));

    // Đặt trạng thái hoạt động
    client.user.setActivity("!help | /help", { type: ActivityType.Playing });

    // Đăng ký Slash Commands toàn cầu
    const targetClientId = client.user.id || CLIENT_ID;
    if (targetClientId && slashCommandsList.length > 0) {
        try {
            console.log(chalk.blue(`[ ${getTimestamp()} ] [ SLASH COMMANDS ] Đang cập nhật ${slashCommandsList.length} lệnh lên Discord API...`));
            const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
            await rest.put(
                Routes.applicationCommands(targetClientId),
                { body: slashCommandsList }
            );
            console.log(chalk.green(`[ ${getTimestamp()} ] [ SLASH COMMANDS ] Đăng ký thành công ${slashCommandsList.length} Slash Command!`));
        } catch (err) {
            console.warn(chalk.yellow(`[ ${getTimestamp()} ] [ SLASH COMMANDS WARN ] Không thể đồng bộ Slash Command:`), err.message);
        }
    }

    // Định kỳ in Uptime & Trạng thái lắng nghe ở Terminal (mỗi 10 phút)
    setInterval(() => {
        const uptimeSec = process.uptime();
        const d = Math.floor(uptimeSec / 86400);
        const h = Math.floor((uptimeSec % 86400) / 3600);
        const m = Math.floor((uptimeSec % 3600) / 60);
        const s = Math.floor(uptimeSec % 60);
        const uptimeStr = `${d > 0 ? `${d}d ` : ""}${h}h ${m}m ${s}s`;
        const heapUsedMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

        console.log(
            chalk.gray(`[ ${getTimestamp()} ] `) +
            chalk.cyan(`[ UPTIME & LẮNG NGHE ] `) +
            chalk.green(`Online: ${uptimeStr} `) +
            chalk.yellow(`| RAM: ${heapUsedMB} MB `) +
            chalk.blue(`| Máy chủ: ${client.guilds.cache.size} `) +
            chalk.magenta(`| Ping: ${client.ws.ping}ms`)
        );
    }, 10 * 60 * 1000);

    // Khởi động lịch tự động chào theo giờ (7h, 11h, 18h, 22h)
    startTimeGreetingScheduler(client);
});

// 5. Xử lý Slash Command (Interaction Create)
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const commandName = interaction.commandName.toLowerCase();
    const command = client.commands.get(commandName);
    if (!command) return;

    const guildName = interaction.guild ? interaction.guild.name : "DM/Private";
    const userTag = interaction.user.tag || interaction.user.username;
    console.log(
        chalk.gray(`[ ${getTimestamp()} ] `) +
        chalk.blue(`[ SLASH ] `) +
        chalk.cyan(`[${guildName} | ${userTag}] `) +
        chalk.yellow(`/${commandName}`)
    );

    const settings = getSettings();
    const isBotAdmin = isAdmin(interaction.user.id);

    // Chế độ Admin Only
    if (settings.adminOnly && !isBotAdmin) {
        return interaction.reply({
            content: "⛔ Bot hiện đang ở chế độ **Admin Only**, chỉ có Quản trị viên bot mới được dùng!",
            ephemeral: true
        });
    }

    // Chế độ QTV Only
    if (settings.qtvOnly && !checkPermission(interaction.member, interaction.user, 1)) {
        return interaction.reply({
            content: "⛔ Bot hiện đang ở chế độ **QTV Only**, chỉ Quản trị viên máy chủ mới được dùng!",
            ephemeral: true
        });
    }

    // Kiểm tra quyền hạn lệnh
    const requiredLevel = command.permissions || 0;
    if (!checkPermission(interaction.member, interaction.user, requiredLevel)) {
        const roleNames = ["Mọi người", "Quản trị viên (QTV)", "Người hỗ trợ (NDH)", "ADMIN BOT"];
        return interaction.reply({
            content: `⛔ Bạn không có đủ quyền để dùng lệnh này!\n(Yêu cầu: **${roleNames[requiredLevel] || requiredLevel}**)`,
            ephemeral: true
        });
    }

    // Kiểm tra Cooldown
    if (!client.cooldowns.has(command.name)) {
        client.cooldowns.set(command.name, new Collection());
    }
    const timestamps = client.cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 1) * 1000;
    const now = Date.now();

    if (timestamps.has(interaction.user.id) && !isBotAdmin) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
        if (now < expirationTime) {
            const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
            return interaction.reply({
                content: `⏳ Vui lòng chờ **${timeLeft}s** để tiếp tục dùng lệnh này!`,
                ephemeral: true
            });
        }
    }
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    // Thực thi lệnh
    try {
        if (typeof command.executeSlash === "function") {
            await command.executeSlash(interaction, {
                client,
                commands: client.commands,
                config,
                settings
            });
        } else {
            await interaction.reply({ content: "⚠️ Lệnh này chưa hỗ trợ tương tác Slash!", ephemeral: true });
        }
    } catch (err) {
        console.error(chalk.red(`[ LỖI SLASH: /${commandName} ]`), err);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: `❌ Đã xảy ra lỗi: ${err.message}` }).catch(() => {});
        } else {
            await interaction.reply({ content: `❌ Đã xảy ra lỗi: ${err.message}`, ephemeral: true }).catch(() => {});
        }
    }
});

// 6. Xử lý Prefix Commands (Message Create)
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    // Tự động thả icon troll nếu người gửi nằm trong danh sách troll của server
    handleTrollReaction(message);

    const guildPrefix = getPrefix(message.guildId);
    const guildName = message.guild ? message.guild.name : "DM/Private";
    const userTag = message.author.tag || message.author.username;

    // Xử lý khi người dùng tag bot đơn thuần
    if (message.content === `<@!${client.user.id}>` || message.content === `<@${client.user.id}>`) {
        console.log(
            chalk.gray(`[ ${getTimestamp()} ] `) +
            chalk.magenta(`[ TAG BOT ] `) +
            chalk.cyan(`[${guildName} | ${userTag}] `) +
            chalk.white(`Đã gửi thông tin bot`)
        );
        return message.reply(`👋 Dạ bot đây nè **${message.author.displayName}**! Bạn cần bot giúp gì hông nè? 🤖✨\n• Tiền tố lệnh: \`${guildPrefix}\`\n• Bạn có thể gọi \`bot mở nhạc <tên>\` để nghe nhạc ngay, hoặc gõ \`${guildPrefix}help\` để xem toàn bộ lệnh nha!`);
    }

    const trimmedContent = message.content.trim();
    const lowerContent = trimmedContent.toLowerCase();

    // 0. Xử lý các lệnh Media KHÔNG CẦN PREFIX (Ví dụ gõ: "gai", "gái", "ff", "anime", "sad", "trai")
    const mediaCmdName = client.aliases.get(lowerContent) || lowerContent;
    const mediaCmd = client.commands.get(mediaCmdName);
    if (mediaCmd && (mediaCmd.category === "Phương tiện" || mediaCmd.noPrefix)) {
        console.log(
            chalk.gray(`[ ${getTimestamp()} ] `) +
            chalk.cyan(`[ NO-PREFIX MEDIA ] `) +
            chalk.cyan(`[${guildName} | ${userTag}] `) +
            chalk.green(`Kích hoạt video "${trimmedContent}"`)
        );
        try {
            if (typeof mediaCmd.executePrefix === "function") {
                return await mediaCmd.executePrefix(message, [], {
                    client,
                    commands: client.commands,
                    config,
                    settings: getSettings()
                });
            }
        } catch (err) {
            console.error(chalk.red(`[ LỖI NO-PREFIX: ${trimmedContent} ]`), err);
        }
    }

    // 1. Phản hồi thông minh với Bot AI khi gọi "bot", mở nhạc, tag bot hoặc reply tin bot
    if (await handleBotChat(message, client)) return;

    // 2. Tự động chào lại khi thành viên nhắn "hi", "chào", "hello", v.v. (chào cả nhà, mn)
    if (await handleAutoGreeting(message)) return;

    // 1. Khi chỉ gõ mỗi prefix (ví dụ: "!") -> Gửi thời gian bot online kèm video
    if (trimmedContent === guildPrefix) {
        console.log(
            chalk.gray(`[ ${getTimestamp()} ] `) +
            chalk.cyan(`[ PREFIX ONLY ] `) +
            chalk.white(`[${guildName} | ${userTag}] `) +
            chalk.green(`Gửi Uptime + Video`)
        );
        return handlePrefixOnly(message, guildPrefix);
    }

    // Nếu tin nhắn không bắt đầu bằng prefix thì bỏ qua
    if (!message.content.startsWith(guildPrefix)) return;

    const afterPrefix = message.content.slice(guildPrefix.length);

    // 2. Khi gõ 2 lần prefix (ví dụ: "!!", "!!help", "! !") -> Báo lỗi nhập 2 lần prefix
    if (trimmedContent.startsWith(guildPrefix + guildPrefix) || afterPrefix.trim().startsWith(guildPrefix)) {
        console.log(
            chalk.gray(`[ ${getTimestamp()} ] `) +
            chalk.yellow(`[ CẢNH BÁO ] `) +
            chalk.white(`[${guildName} | ${userTag}] `) +
            chalk.yellow(`Nhấn 2 lần prefix: "${trimmedContent}"`)
        );
        return handleWrongCommand(message, {
            prefix: guildPrefix,
            isDoublePrefix: true
        });
    }

    const args = afterPrefix.trim().split(/\s+/);
    const cmdName = args.shift()?.toLowerCase();
    if (!cmdName) {
        return handlePrefixOnly(message, guildPrefix);
    }

    // Tìm lệnh gốc hoặc qua alias
    const actualName = client.aliases.get(cmdName) || cmdName;
    const command = client.commands.get(actualName);

    // 3. Khi nhập sai lệnh (lệnh không tồn tại) -> Báo nhập sai lệnh
    if (!command) {
        console.log(
            chalk.gray(`[ ${getTimestamp()} ] `) +
            chalk.red(`[ SAI LỆNH ] `) +
            chalk.white(`[${guildName} | ${userTag}] `) +
            chalk.red(`Lệnh không tồn tại: "${guildPrefix}${cmdName}"`)
        );
        return handleWrongCommand(message, {
            cmdName,
            prefix: guildPrefix,
            isDoublePrefix: false
        });
    }

    const settings = getSettings();
    const isBotAdmin = isAdmin(message.author.id);

    // Chế độ Admin Only
    if (settings.adminOnly && !isBotAdmin) {
        return message.reply("⛔ Bot đang ở chế độ **Admin Only**, chỉ Quản trị viên bot mới được dùng!");
    }

    // Chế độ QTV Only
    if (settings.qtvOnly && !checkPermission(message.member, message.author, 1)) {
        return message.reply("⛔ Bot đang ở chế độ **QTV Only**, chỉ Quản trị viên máy chủ mới được dùng!");
    }

    // Kiểm tra quyền hạn
    const requiredLevel = command.permissions || 0;
    if (!checkPermission(message.member, message.author, requiredLevel)) {
        const roleNames = ["Mọi người", "Quản trị viên (QTV)", "Người hỗ trợ (NDH)", "ADMIN BOT"];
        return message.reply(`⛔ Bạn không đủ quyền để dùng lệnh này!\n(Yêu cầu: **${roleNames[requiredLevel] || requiredLevel}**)`);
    }

    // Kiểm tra Cooldown
    if (!client.cooldowns.has(command.name)) {
        client.cooldowns.set(command.name, new Collection());
    }
    const timestamps = client.cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 1) * 1000;
    const now = Date.now();

    if (timestamps.has(message.author.id) && !isBotAdmin) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
        if (now < expirationTime) {
            const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
            return message.reply(`⏳ Vui lòng chờ **${timeLeft}s** để tiếp tục sử dụng lệnh này!`);
        }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    console.log(
        chalk.gray(`[ ${getTimestamp()} ] `) +
        chalk.magenta(`[ PREFIX ] `) +
        chalk.cyan(`[${guildName} | ${userTag}] `) +
        chalk.green(`${guildPrefix}${cmdName}${args.length ? " " + args.join(" ") : ""}`)
    );

    // Thực thi lệnh Prefix
    try {
        if (typeof command.executePrefix === "function") {
            await command.executePrefix(message, args, {
                client,
                commands: client.commands,
                config,
                settings
            });
        }
    } catch (err) {
        console.error(chalk.red(`[ LỖI PREFIX: ${guildPrefix}${cmdName} ]`), err);
        message.reply(`❌ Đã xảy ra lỗi khi thực thi lệnh: ${err.message}`).catch(() => {});
    }
});

// 7. Xử lý Thả cảm xúc Dislike (👎) để gỡ / thu hồi tin nhắn của Bot
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (err) {
            return;
        }
    }

    const message = reaction.message;
    if (message.partial) {
        try {
            await message.fetch();
        } catch (err) {
            return;
        }
    }

    // Chỉ gỡ tin nhắn do chính Bot gửi
    if (message.author && message.author.id === client.user.id) {
        const dislikeEmojis = ["👎", "👎🏻", "👎🏼", "👎🏽", "👎🏾", "👎🏿", "❌", "🗑️"];
        const emojiName = reaction.emoji.name;

        if (dislikeEmojis.includes(emojiName) || (emojiName && emojiName.toLowerCase().includes("dislike"))) {
            const guildName = message.guild ? message.guild.name : "DM/Private";
            const userTag = user.tag || user.username;

            console.log(
                chalk.gray(`[ ${getTimestamp()} ] `) +
                chalk.red(`[ GỠ TIN NHẮN (DISLIKE) ] `) +
                chalk.cyan(`[${guildName} | ${userTag}] `) +
                chalk.yellow(`Thu hồi tin nhắn qua reaction ${emojiName}`)
            );

            if (message.deletable) {
                await message.delete().catch(() => {});
            }
        }
    }
});

// 8. Chào đón thành viên mới tham gia máy chủ (Guild Member Add)
client.on(Events.GuildMemberAdd, async (member) => {
    await handleMemberJoin(member);
});

// 9. Bảo vệ tiến trình (Process Protection)
process.on("unhandledRejection", (reason, promise) => {
    console.error(chalk.yellow("[ UNHANDLED REJECTION ]"), reason);
});

process.on("uncaughtException", (err) => {
    console.error(chalk.red("[ UNCAUGHT EXCEPTION ]"), err);
});

// 9. Đăng nhập Bot
client.login(BOT_TOKEN).catch(err => {
    console.error(chalk.bold.red("[ ĐĂNG NHẬP THẤT BẠI ] Không thể kết nối tới Discord API!"), err.message);
});
