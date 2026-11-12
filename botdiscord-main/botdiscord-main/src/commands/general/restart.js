const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { spawn } = require("child_process");

module.exports = {
    name: "rs",
    description: "Khởi động lại Bot (Chỉ dành cho ADMIN BOT)",
    category: "Quản trị",
    aliases: ["restart", "reboot"],
    cooldown: 10,
    permissions: 3, // Level 3: Admin Bot
    data: new SlashCommandBuilder()
        .setName("rs")
        .setDescription("Khởi động lại Bot (Chỉ dành cho ADMIN BOT)")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async executeSlash(interaction) {
        await interaction.reply({ content: "🔄 Bot đang tiến hành khởi động lại trong giây lát...", ephemeral: false });
        rebootProcess();
    },

    async executePrefix(message) {
        await message.reply("🔄 Bot đang tiến hành khởi động lại trong giây lát...");
        rebootProcess();
    }
};

function rebootProcess() {
    setTimeout(() => {
        try {
            const child = spawn(process.argv[0], process.argv.slice(1), {
                detached: true,
                stdio: "inherit"
            });
            child.unref();
        } catch (e) {}
        process.exit(0);
    }, 1000);
}
