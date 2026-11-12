const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "ping",
    description: "Kiểm tra độ trễ phản hồi của Bot",
    category: "Hệ thống",
    aliases: ["p"],
    cooldown: 3,
    permissions: 0,
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Kiểm tra độ trễ phản hồi của Bot"),

    async executeSlash(interaction, { client }) {
        const sent = await interaction.reply({ content: "🏓 Đang kiểm tra độ trễ...", fetchReply: true });
        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const wsPing = client.ws.ping;

        const embed = new EmbedBuilder()
            .setColor("#00FF88")
            .setTitle("🏓 PONG!")
            .addFields(
                { name: "⚡ Độ trễ WebSocket", value: `\`${wsPing}ms\``, inline: true },
                { name: "🔄 Độ trễ Khứ hồi", value: `\`${roundtrip}ms\``, inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ content: null, embeds: [embed] });
    },

    async executePrefix(message, args, { client }) {
        const start = Date.now();
        const sent = await message.reply("🏓 Đang kiểm tra độ trễ...");
        const roundtrip = Date.now() - start;
        const wsPing = client.ws.ping;

        const embed = new EmbedBuilder()
            .setColor("#00FF88")
            .setTitle("🏓 PONG!")
            .addFields(
                { name: "⚡ Độ trễ WebSocket", value: `\`${wsPing}ms\``, inline: true },
                { name: "🔄 Độ trễ Khứ hồi", value: `\`${roundtrip}ms\``, inline: true }
            )
            .setTimestamp();

        await sent.edit({ content: null, embeds: [embed] });
    }
};
