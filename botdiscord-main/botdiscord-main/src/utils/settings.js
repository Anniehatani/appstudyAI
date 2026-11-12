const fs = require("fs-extra");
const path = require("path");
const { PermissionsBitField } = require("discord.js");

const settingsPath = path.join(__dirname, "../../data/settings.json");
const configPath = path.join(__dirname, "../../config.json");

function getConfig() {
    try {
        if (fs.existsSync(configPath)) {
            return fs.readJsonSync(configPath);
        }
    } catch (e) {}
    return {
        BOTNAME: "Annie🌷",
        PREFIX: "!",
        DISCORD: { TOKEN: "", CLIENT_ID: "", PREFIX: "!", ADMINBOT: [], NDH: [] },
        adminOnly: false,
        qtvOnly: false
    };
}

function getSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            return fs.readJsonSync(settingsPath);
        }
    } catch (e) {}
    return { guilds: {}, admins: [], ndh: [], adminOnly: false, qtvOnly: false };
}

function saveSettings(data) {
    try {
        fs.ensureDirSync(path.dirname(settingsPath));
        fs.writeJsonSync(settingsPath, data, { spaces: 2 });
    } catch (e) {
        console.error("Lỗi lưu file settings.json:", e);
    }
}

function getPrefix(guildId) {
    const config = getConfig();
    const defaultPrefix = config.DISCORD?.PREFIX || config.PREFIX || "!";
    if (!guildId) return defaultPrefix;
    const settings = getSettings();
    return settings.guilds?.[guildId]?.prefix || defaultPrefix;
}

function setPrefix(guildId, prefix) {
    const settings = getSettings();
    if (!settings.guilds) settings.guilds = {};
    if (!settings.guilds[guildId]) settings.guilds[guildId] = {};
    settings.guilds[guildId].prefix = prefix;
    saveSettings(settings);
}

function getAdmins() {
    const config = getConfig();
    const settings = getSettings();
    const cfgAdmins = config.DISCORD?.ADMINBOT || config.ADMINBOT || [];
    const setAdmins = settings.admins || [];
    return Array.from(new Set([...cfgAdmins, ...setAdmins]));
}

function getNDH() {
    const config = getConfig();
    const settings = getSettings();
    const cfgNDH = config.DISCORD?.NDH || config.NDH || [];
    const setNDH = settings.ndh || [];
    return Array.from(new Set([...cfgNDH, ...setNDH]));
}

function isAdmin(userId) {
    if (!userId) return false;
    return getAdmins().includes(String(userId));
}

function isNDH(userId) {
    if (!userId) return false;
    return isNDH_or_Admin(userId);
}

function isNDH_or_Admin(userId) {
    if (!userId) return false;
    const strId = String(userId);
    return getAdmins().includes(strId) || getNDH().includes(strId);
}

function checkPermission(member, user, requiredLevel = 0) {
    if (requiredLevel === 0) return true;
    const userId = user?.id || member?.id;

    // Level 3: Admin Bot
    if (requiredLevel >= 3) {
        return isAdmin(userId);
    }

    // Level 2: NDH hoặc Admin Bot
    if (requiredLevel === 2) {
        return isNDH_or_Admin(userId);
    }

    // Level 1: QTV Server (Admin Guild) hoặc Admin Bot
    if (requiredLevel === 1) {
        if (isAdmin(userId)) return true;
        if (member && member.permissions) {
            return member.permissions.has(PermissionsBitField.Flags.Administrator) ||
                   member.permissions.has(PermissionsBitField.Flags.ManageGuild);
        }
        return false;
    }

    return true;
}

function getWelcomeConfig(guildId) {
    if (!guildId) return { enabled: true, channelId: null, message: null };
    const settings = getSettings();
    const welcome = settings.guilds?.[guildId]?.welcome;
    return {
        enabled: welcome?.enabled !== false,
        channelId: welcome?.channelId || null,
        message: welcome?.message || null
    };
}

function setWelcomeConfig(guildId, welcomeData) {
    const settings = getSettings();
    if (!settings.guilds) settings.guilds = {};
    if (!settings.guilds[guildId]) settings.guilds[guildId] = {};
    if (!settings.guilds[guildId].welcome) {
        settings.guilds[guildId].welcome = { enabled: true, channelId: null, message: null };
    }
    settings.guilds[guildId].welcome = {
        ...settings.guilds[guildId].welcome,
        ...welcomeData
    };
    saveSettings(settings);
    return settings.guilds[guildId].welcome;
}

function getAutoGreetingConfig(guildId) {
    if (!guildId) return true;
    const settings = getSettings();
    const autoGreet = settings.guilds?.[guildId]?.autoGreeting;
    return autoGreet !== false;
}

function setAutoGreetingConfig(guildId, enabled) {
    const settings = getSettings();
    if (!settings.guilds) settings.guilds = {};
    if (!settings.guilds[guildId]) settings.guilds[guildId] = {};
    settings.guilds[guildId].autoGreeting = Boolean(enabled);
    saveSettings(settings);
    return settings.guilds[guildId].autoGreeting;
}

function getTimeGreetingConfig(guildId) {
    if (!guildId) return true;
    const settings = getSettings();
    const timeGreet = settings.guilds?.[guildId]?.timeGreeting;
    return timeGreet !== false;
}

function setTimeGreetingConfig(guildId, enabled) {
    const settings = getSettings();
    if (!settings.guilds) settings.guilds = {};
    if (!settings.guilds[guildId]) settings.guilds[guildId] = {};
    settings.guilds[guildId].timeGreeting = Boolean(enabled);
    saveSettings(settings);
    return settings.guilds[guildId].timeGreeting;
}

function getBeAnhConfig(guildId) {
    if (!guildId) return true;
    const settings = getSettings();
    const beAnh = settings.guilds?.[guildId]?.beAnh;
    return beAnh !== false;
}

function setBeAnhConfig(guildId, enabled) {
    const settings = getSettings();
    if (!settings.guilds) settings.guilds = {};
    if (!settings.guilds[guildId]) settings.guilds[guildId] = {};
    settings.guilds[guildId].beAnh = Boolean(enabled);
    saveSettings(settings);
    return settings.guilds[guildId].beAnh;
}

module.exports = {
    getConfig,
    getSettings,
    saveSettings,
    getPrefix,
    setPrefix,
    getWelcomeConfig,
    setWelcomeConfig,
    getAutoGreetingConfig,
    setAutoGreetingConfig,
    getTimeGreetingConfig,
    setTimeGreetingConfig,
    getBeAnhConfig,
    setBeAnhConfig,
    getAdmins,
    getNDH,
    isAdmin,
    isNDH: isNDH_or_Admin,
    checkPermission
};



