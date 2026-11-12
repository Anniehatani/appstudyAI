const path = require("path");
const fs = require("fs-extra");
const { execFile } = require("child_process");
const Youtube = require("youtube-search-api");

const ytdlpPath = path.join(process.cwd(), "bin", "yt-dlp.exe");

let innertubeInstance = null;

/**
 * Khởi tạo hoặc lấy instance Innertube dùng chung
 */
async function getInnertube() {
    if (!innertubeInstance) {
        const { Innertube, UniversalCache } = await import("youtubei.js");
        innertubeInstance = await Innertube.create({
            cache: new UniversalCache(false)
        });
    }
    return innertubeInstance;
}

/**
 * Chuyển đổi định dạng thời lượng (VD: "3:45", "1:15:30") sang giây
 */
function parseDurationToSeconds(durationStr) {
    if (!durationStr || typeof durationStr !== "string") return 0;
    const parts = durationStr.split(":").map(p => parseInt(p, 10));
    if (parts.some(isNaN)) return 0;
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
        return parts[0];
    }
    return 0;
}

/**
 * Tìm kiếm 5 video / bài hát đầu tiên trên YouTube (tối đa dưới 30 phút)
 */
async function search5(query) {
    // Nếu là link YouTube trực tiếp
    const match = query.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) {
        const videoId = match[1];
        try {
            const yt = await getInnertube();
            const info = await yt.getBasicInfo(videoId);
            const durationSec = info.basic_info.duration || 0;
            return [{
                id: videoId,
                title: info.basic_info.title || "YouTube Video",
                channel: info.basic_info.author || "YouTube",
                duration: formatSeconds(durationSec),
                durationSec,
                thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                url: `https://www.youtube.com/watch?v=${videoId}`
            }];
        } catch (e) {
            return [{
                id: videoId,
                title: "YouTube Video",
                channel: "YouTube",
                duration: "N/A",
                durationSec: 0,
                thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                url: `https://www.youtube.com/watch?v=${videoId}`
            }];
        }
    }

    try {
        const results = await Youtube.GetListByKeyword(query, false, 15);
        if (!results || !results.items || results.items.length === 0) {
            return [];
        }

        const videos = results.items
            .filter(item => item.type === "video" && item.id)
            .map(v => {
                const durationText = v.length?.simpleText || "N/A";
                const durationSec = parseDurationToSeconds(durationText);
                return {
                    id: v.id,
                    title: v.title,
                    channel: v.channelTitle || "YouTube",
                    duration: durationText,
                    durationSec,
                    thumbnail: v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
                    url: `https://www.youtube.com/watch?v=${v.id}`
                };
            })
            // Lọc không chọn video quá 1 tiếng rưỡi (5400 giây)
            .filter(v => v.durationSec === 0 || v.durationSec <= 5400)
            .slice(0, 5);

        return videos;
    } catch (err) {
        console.error("Lỗi tìm kiếm YouTube:", err.message);
        return [];
    }
}

/**
 * Tải file âm thanh từ YouTube (m4a, bitrate tốt, phát trực tiếp trên Discord)
 */
async function downloadAudio(videoId) {
    const cacheDir = path.join(process.cwd(), "data", "cache", "audio");
    fs.ensureDirSync(cacheDir);

    const outputTemplate = path.join(cacheDir, `${videoId}_%(title).50s.%(ext)s`);

    const args = [
        "--js-runtimes", "node",
        "-f", "140/ba[ext=m4a]/ba",
        "--max-filesize", "25M",
        "--no-playlist",
        "--print-json",
        "-o", outputTemplate,
        `https://www.youtube.com/watch?v=${videoId}`
    ];

    return new Promise((resolve, reject) => {
        execFile(ytdlpPath, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) {
                const errMsg = stderr || err.message;
                if (errMsg.includes("File is larger than max-filesize")) {
                    return reject(new Error("File âm thanh vượt quá giới hạn 25MB của Discord!"));
                }
                return reject(new Error(`Lỗi tải âm thanh: ${errMsg.slice(0, 150)}`));
            }

            try {
                const lines = (stdout || "").trim().split("\n");
                const jsonLine = lines.find(l => l.trim().startsWith("{"));
                if (!jsonLine) throw new Error("Không nhận diện được phản hồi metadata từ YouTube!");
                const info = JSON.parse(jsonLine);
                let filePath = info._filename;

                if (!filePath || !fs.existsSync(filePath)) {
                    const files = fs.readdirSync(cacheDir);
                    const found = files.find(f => f.startsWith(videoId));
                    if (!found) throw new Error("Không tìm thấy file âm thanh đã tải!");
                    filePath = path.join(cacheDir, found);
                }

                const stats = fs.statSync(filePath);
                const safeTitle = (info.title || "audio").replace(/[\\/:*?"<>|]/g, "_").slice(0, 40);

                resolve({
                    filePath,
                    fileName: `${safeTitle}.m4a`,
                    fileSize: stats.size,
                    title: info.title,
                    channel: info.channel || info.uploader || "YouTube",
                    duration: formatSeconds(info.duration || 0),
                    thumbnail: info.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
                });
            } catch (parseErr) {
                reject(parseErr);
            }
        });
    });
}

/**
 * Tải file video MP4 từ YouTube (Progressive 360p kèm cả hình và tiếng, gửi ngay trên Discord)
 */
async function downloadVideo(videoId) {
    const cacheDir = path.join(process.cwd(), "data", "cache", "video");
    fs.ensureDirSync(cacheDir);

    const outputTemplate = path.join(cacheDir, `${videoId}_%(title).50s.%(ext)s`);

    const args = [
        "--js-runtimes", "node",
        "--extractor-args", "youtube:player_client=android,web",
        "-f", "18/b[ext=mp4]/best",
        "--max-filesize", "50M",
        "--no-playlist",
        "--print-json",
        "-o", outputTemplate,
        `https://www.youtube.com/watch?v=${videoId}`
    ];

    return new Promise((resolve, reject) => {
        execFile(ytdlpPath, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) {
                const errMsg = stderr || err.message;
                if (errMsg.includes("File is larger than max-filesize")) {
                    return reject(new Error("Dung lượng video vượt quá giới hạn 50MB!"));
                }
                return reject(new Error(`Lỗi tải video: ${errMsg.slice(0, 150)}`));
            }

            try {
                const lines = (stdout || "").trim().split("\n");
                const jsonLine = lines.find(l => l.trim().startsWith("{"));
                if (!jsonLine) throw new Error("Không nhận diện được phản hồi metadata từ YouTube!");
                const info = JSON.parse(jsonLine);
                let filePath = info._filename;

                if (!filePath || !fs.existsSync(filePath)) {
                    const files = fs.readdirSync(cacheDir);
                    const found = files.find(f => f.startsWith(videoId));
                    if (!found) throw new Error("Không tìm thấy file video đã tải!");
                    filePath = path.join(cacheDir, found);
                }

                // Kiểm tra thời lượng (không quá 1 tiếng rưỡi = 5400s)
                if (info.duration && info.duration > 5400) {
                    if (filePath && fs.existsSync(filePath)) cleanupFile(filePath);
                    return reject(new Error(`Video này dài hơn 1 tiếng rưỡi (${formatSeconds(info.duration)})! Bot chỉ hỗ trợ video từ 1 tiếng rưỡi trở lại và tối đa 50MB.`));
                }

                const stats = fs.statSync(filePath);
                if (stats.size > 50 * 1024 * 1024) {
                    if (filePath && fs.existsSync(filePath)) cleanupFile(filePath);
                    return reject(new Error(`Dung lượng video (${(stats.size / 1024 / 1024).toFixed(1)}MB) vượt quá giới hạn 50MB!`));
                }

                const safeTitle = (info.title || "video").replace(/[\\/:*?"<>|]/g, "_").slice(0, 40);

                resolve({
                    filePath,
                    fileName: `${safeTitle}.mp4`,
                    fileSize: stats.size,
                    title: info.title,
                    channel: info.channel || info.uploader || "YouTube",
                    duration: formatSeconds(info.duration || 0),
                    thumbnail: info.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
                });
            } catch (parseErr) {
                reject(parseErr);
            }
        });
    });
}

/**
 * Dọn dẹp/Format lại file và thư mục cache
 */
function cleanupFile(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (e) {
        console.error("Lỗi xóa file cache:", e.message);
    }
}

function formatSeconds(sec) {
    if (!sec || isNaN(sec)) return "N/A";
    const s = parseInt(sec, 10);
    const m = Math.floor(s / 60);
    const remS = s % 60;
    return `${m}:${remS < 10 ? "0" : ""}${remS}`;
}

module.exports = {
    search5,
    downloadAudio,
    downloadVideo,
    cleanupFile
};
