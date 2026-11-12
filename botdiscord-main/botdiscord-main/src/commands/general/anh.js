const { SlashCommandBuilder } = require("discord.js");
const botCommand = require("./bot");

module.exports = {
    ...botCommand,
    name: "anh",
    description: "Trò chuyện cùng Bot AI (alias của /bot)",
    aliases: ["beanh", "chatbot"],
    data: new SlashCommandBuilder()
        .setName("anh")
        .setDescription("Trò chuyện cùng Bot AI hoặc cấu hình bật/tắt")
        .addSubcommand(sub =>
            sub.setName("chat")
                .setDescription("Gửi tin nhắn trò chuyện trực tiếp với Bot")
                .addStringOption(opt =>
                    opt.setName("message")
                        .setDescription("Nội dung muốn nói với Bot")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub => sub.setName("on").setDescription("Bật tính năng Bot tự động phản hồi"))
        .addSubcommand(sub => sub.setName("off").setDescription("Tắt tính năng Bot tự động phản hồi"))
        .addSubcommand(sub => sub.setName("status").setDescription("Xem trạng thái hoạt động của Bot"))
};
