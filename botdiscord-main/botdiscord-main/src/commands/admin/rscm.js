const { SlashCommandBuilder, PermissionFlagsBits, REST, Routes } = require("discord.js");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const { isAdmin, getConfig } = require("../../utils/settings");

module.exports = {
    name: "rscm",
    description: "Tải lại và cập nhật toàn bộ hệ thống lệnh bot (Chỉ dành cho ADMIN BOT)",
    category: "Quản trị",
    aliases: ["reload", "reloadcmd", "reloadcommands"],
    cooldown: 5,
    permissions: 3, // Level 3: Admin Bot
    data: new SlashCommandBuilder()
        .setName("rscm")
        .setDescription("Tải lại toàn bộ hệ thống lệnh bot (Chỉ dành cho ADMIN BOT)")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async executeSlash(interaction, { client }) {
        if (!isAdmin(interaction.user.id)) {
            return interaction.reply({
                content: "⛔ Chỉ **ADMIN BOT** mới có quyền chạy lại bộ lệnh!",
                ephemeral: true
            });
        }

        await interaction.deferReply();
        const result = await reloadAllCommands(client);
        return interaction.editReply(result.message);
    },

    async executePrefix(message, args, { client }) {
        if (!isAdmin(message.author.id)) {
            return message.reply("⛔ Chỉ **ADMIN BOT** mới có quyền chạy lại bộ lệnh!");
        }

        const waitMsg = await message.reply("🔄 Đang tải lại toàn bộ hệ thống lệnh, vui lòng chờ...");
        const result = await reloadAllCommands(client);
        return waitMsg.edit(result.message);
    }
};

/**
 * Xóa cache và tải lại toàn bộ commands trong thư mục src/commands
 */
async function reloadAllCommands(client) {
    const commandsDir = path.join(__dirname, "../..");
    const srcCommandsDir = path.join(commandsDir, "commands");

    if (!fs.existsSync(srcCommandsDir)) {
        return {
            success: false,
            message: "❌ Thư mục lệnh không tồn tại!"
        };
    }

    // Xóa danh sách lệnh hiện tại
    client.commands.clear();
    client.aliases.clear();

    // Xóa cache của toàn bộ file trong src/utils để nạp logic mới (như youtubeDownloader)
    const srcUtilsDir = path.join(commandsDir, "utils");
    if (fs.existsSync(srcUtilsDir)) {
        const utilFiles = fs.readdirSync(srcUtilsDir);
        for (const file of utilFiles) {
            if (file.endsWith(".js")) {
                const utilPath = path.join(srcUtilsDir, file);
                try {
                    delete require.cache[require.resolve(utilPath)];
                } catch (e) {}
            }
        }
    }

    const slashCommandsList = [];
    let loadedCount = 0;
    const errors = [];

    function loadDir(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                loadDir(fullPath);
            } else if (file.endsWith(".js")) {
                try {
                    // Xóa cache của file để require nhận code mới
                    delete require.cache[require.resolve(fullPath)];

                    const command = require(fullPath);
                    if (!command.name) continue;

                    client.commands.set(command.name.toLowerCase(), command);
                    loadedCount++;

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
                    errors.push(`${file}: ${err.message}`);
                }
            }
        }
    }

    loadDir(srcCommandsDir);

    // Cập nhật lại Slash Commands lên Discord API
    const config = getConfig();
    const BOT_TOKEN = process.env.DISCORD_TOKEN || config.DISCORD?.TOKEN;
    const targetClientId = client.user?.id || process.env.DISCORD_CLIENT_ID || config.DISCORD?.CLIENT_ID;

    let slashStatus = "";
    if (targetClientId && BOT_TOKEN && slashCommandsList.length > 0) {
        try {
            const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
            await rest.put(
                Routes.applicationCommands(targetClientId),
                { body: slashCommandsList }
            );
            slashStatus = ` và đồng bộ **${slashCommandsList.length}** Slash Commands`;
        } catch (err) {
            slashStatus = ` (⚠️ lỗi đồng bộ Slash: ${err.message})`;
        }
    }

    console.log(chalk.green(`[ RSCM ] Đã nạp lại ${loadedCount} lệnh thành công!`));

    let responseMsg = `✅ **ĐÃ CHẠY LẠI BỘ LỆNH THÀNH CÔNG!**\n• Tổng số lệnh: **${loadedCount}** lệnh${slashStatus}.`;
    if (errors.length > 0) {
        responseMsg += `\n⚠️ Một số file gặp lỗi khi nạp:\n\`\`\`\n${errors.slice(0, 3).join("\n")}\n\`\`\``;
    }

    return {
        success: true,
        message: responseMsg
    };
}
