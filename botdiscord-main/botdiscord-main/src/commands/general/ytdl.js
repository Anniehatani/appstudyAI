const { SlashCommandBuilder } = require("discord.js");
const singCommand = require("./sing");

module.exports = {
    name: "ytdl",
    description: "Tải và gửi trực tiếp file âm thanh YouTube (bài hát đầu tiên) lên Discord",
    category: "Nhạc",
    aliases: ["playaudio", "mp3", "playsong"],
    cooldown: 5,
    permissions: 0,
    data: new SlashCommandBuilder()
        .setName("ytdl")
        .setDescription("Tải file âm thanh bài hát YouTube lên Discord (tự chọn bài đầu tiên)")
        .addStringOption(opt =>
            opt.setName("song")
                .setDescription("Tên bài hát hoặc link YouTube cần phát")
                .setRequired(true)
        ),

    async executeSlash(interaction) {
        return singCommand.executeSlash(interaction);
    },

    async executePrefix(message, args) {
        return singCommand.executePrefix(message, args);
    }
};
