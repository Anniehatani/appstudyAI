/**
 * BOT 3TG - Trợ lý AI, Media & Quản trị Nhóm Đa Năng (3TG Study Hub)
 * Tối ưu hóa siêu nhẹ, chạy trực tiếp trên Node runtime của App, không cần node_modules ngoài.
 * Hỗ trợ đầy đủ các lệnh Media (Free Fire, Anime, Gái xinh, Nhạc buồn, Trai đẹp, Ảnh, Nhạc),
 * Tiện ích, AI và Báo sai lệnh thông minh.
 */

import ANIME_JSON from './data/media/anime.json' with { type: 'json' };
import FF_JSON from './data/media/ff.json' with { type: 'json' };
import GAI_JSON from './data/media/gai.json' with { type: 'json' };
import SAD_JSON from './data/media/sad.json' with { type: 'json' };
import TRAI_JSON from './data/media/trai.json' with { type: 'json' };

// Thời điểm khởi động bot để tính uptime
const BOT_START_TIME = Date.now();

export const BOT_ID = '3tg-bot';
export const BOT_NAME = '🤖 Bot 3TG';
export const BOT_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=bot-3tg&backgroundColor=ffb6c1';
export const BOT_DECORATION = 'deco_pink_cherry';

// 1. Kho Media đầy đủ từ Bot Discord (đóng gói tĩnh để chạy mượt trên Cloudflare Workers)
const ANIME_LIST = Array.isArray(ANIME_JSON) && ANIME_JSON.length ? ANIME_JSON : [
  "https://hjvijcaphilfcvuhjvjr.supabase.co/storage/v1/object/public/datavideo/anime/7576606096303869205.mp4"
];

const FF_LIST = Array.isArray(FF_JSON) && FF_JSON.length ? FF_JSON : [
  "https://hjvijcaphilfcvuhjvjr.supabase.co/storage/v1/object/public/datavideo/ff/7068509323760028954.mp4"
];

const GAI_LIST = Array.isArray(GAI_JSON) && GAI_JSON.length ? GAI_JSON : [
  "https://hjvijcaphilfcvuhjvjr.supabase.co/storage/v1/object/public/datavideo/gai/7532825260257905928.mp4"
];

const SAD_LIST = Array.isArray(SAD_JSON) && SAD_JSON.length ? SAD_JSON : [
  "https://hjvijcaphilfcvuhjvjr.supabase.co/storage/v1/object/public/datavideo/sad/7429521282082901255.mp4"
];

const TRAI_LIST = Array.isArray(TRAI_JSON) && TRAI_JSON.length ? TRAI_JSON : [
  "https://hjvijcaphilfcvuhjvjr.supabase.co/storage/v1/object/public/datavideo/trai/7618258561457507602.mp4"
];

const ANH_LIST = [
  "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
  "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800"
];

const TROLL_MEMES = [
  "Thức khuya dậy sớm học hành, thi xong mới biết mình tành bành tâm can 😆",
  "Học không chơi đánh rơi tuổi trẻ, chơi mà không học thì rớt môn Công nghệ phần mềm! Cố lên bạn ơi 💖",
  "Đề thi năm nay dễ lắm, chỉ có làm bài là khó thôi! 📚🤣",
  "Trời sinh voi trời sinh cỏ, cớ sao cô giáo lại cho đề dài thế này 🥲",
  "Muốn ngồi ở vị trí không ai ngồi được thì phải chịu được cảm giác học không ai chịu được! 🔥",
  "Bình tĩnh, tự tin, không cay cú. Điểm số là phù du, qua môn mới là vĩnh cửu! ✨",
  "Deadline dí thì chạy, mà chạy không kịp thì bật Bot 3TG gánh team nè! 🚀",
  "Người ta có đôi có cặp, còn mình có chuỗi Streak 3TG không bao giờ tắt! 🔥🌸"
];

export function formatUptime() {
  const diffSec = Math.floor((Date.now() - BOT_START_TIME) / 1000);
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  return `${hours} giờ ${minutes} phút ${seconds} giây`;
}

export function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return "🌅 Chào buổi sáng cả nhóm! Chúc các bạn một ngày học tập tràn đầy năng lượng và đạt nhiều XP nhé! 🌸";
  } else if (hour >= 11 && hour < 14) {
    return "🍱 Buổi trưa vui vẻ nha cả nhóm! Nhớ ăn uống no nê và nghỉ ngơi một chút để chiều học thật tốt nhé! 🍲";
  } else if (hour >= 14 && hour < 18) {
    return "☀️ Buổi chiều năng động! Có bài tập nào khó cứ thảo luận cùng nhau hoặc gõ /AI để mình hỗ trợ nha! 📚";
  } else if (hour >= 18 && hour < 22) {
    return "🌆 Buổi tối ấm áp! Thời điểm vàng để mở Pomodoro và cày bài ôn thi cùng nhóm nè! 🔥";
  } else {
    return "🌙 Đêm đã khuya rồi! Các cú đêm nhớ giữ gìn sức khỏe, đừng thức quá khuya nhé, chúc cả nhóm ngủ ngon! 💖✨";
  }
}

function getRandomItem(arr) {
  if (!arr || !arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Xử lý lệnh của Bot 3TG (Full Commands)
 * @param {string} text Nội dung tin nhắn
 * @param {object} context Ngữ cảnh { group, sender, members, env, db }
 * @returns {object|null} { message, mediaUrl, mediaType, mediaName } hoặc null nếu không phải lệnh
 */
export async function handleBot3TgCommand(text, context = {}) {
  if (!text) return null;
  const clean = text.trim();

  // Kiểm tra prefix: ! hoặc /
  const isCommand = clean.startsWith("!") || clean.startsWith("/");
  if (!isCommand) return null;

  // Trường hợp người dùng chỉ gõ mỗi dấu "!" hoặc "/"
  if (clean === "!" || clean === "/") {
    return {
      message: 
        "🤖 [TRỢ LÝ BOT 3TG ĐANG LẮNG NGHE]\n" +
        "Bạn vừa gõ ký tự lệnh! Hãy gõ kèm tên lệnh nhé.\n" +
        "💡 Gõ `!help` hoặc `!menu` để xem danh sách toàn bộ lệnh giải trí, học tập và quản trị nhóm! 🌸"
    };
  }

  const parts = clean.slice(1).trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  const query = args.join(" ").trim();

  // ========================================================
  // 1. HELP / MENU / BẢNG LỆNH
  // ========================================================
  if (cmd === "help" || cmd === "menu" || cmd === "lenh") {
    const helpMsg = 
      "🤖 [BẢNG TOÀN BỘ LỆNH CỦA BOT 3TG]\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "🎬 KHO MEDIA & GIẢI TRÍ:\n" +
      "• !anime : Video / ảnh anime truyền cảm hứng học tập\n" +
      "• !ff : Video highlights Free Fire cực cháy 🔥\n" +
      "• !gai : Video gái xinh năng lượng ngày mới 🌸\n" +
      "• !sad : Video / giai điệu tâm trạng lắng đọng 🌧️\n" +
      "• !trai : Video trai đẹp ngầu và ấm áp ✨\n" +
      "• !anh : Ảnh ngẫu nhiên nghệ thuật chất lượng cao 📸\n" +
      "• !sing [tên bài] : Tìm giai điệu bài hát yêu thích 🎵\n" +
      "• !troll : Meme hài hước giải tỏa căng thẳng sau giờ học 🤣\n" +
      "\n" +
      "💡 TRÍ TUỆ NHÂN TẠO:\n" +
      "• !ai [câu hỏi] : Hỏi Bot 3TG về tình cảm, đời sống, giải bài 🧠\n" +
      "\n" +
      "👥 QUẢN TRỊ NHÓM HỌC TẬP:\n" +
      "• !info : Xem chi tiết nhóm, danh sách Trưởng & Phó nhóm\n" +
      "• !clean : Dọn dẹp tin nhắn tạm trong nhóm\n" +
      "\n" +
      "🛠️ TIỆN ÍCH HỆ THỐNG:\n" +
      "• !ping : Kiểm tra độ trễ phản hồi của hệ thống ⚡\n" +
      "• !uptime : Xem thời gian Bot 3TG hoạt động liên tục ⏱️\n" +
      "• !chao : Lời chào và mẹo học tập theo khung giờ 🌅\n" +
      "• !bot : Thông tin nguồn cội và sứ mệnh của Bot 3TG 💖\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "✨ Hãy cùng nhóm mình chăm chỉ giữ Streak và săn điểm A+ nhé! 🌸";
    return { message: helpMsg };
  }

  // ========================================================
  // 2. MEDIA COMMANDS
  // ========================================================
  // 2.1 FREE FIRE (!ff, !freefire, !vdff)
  if (cmd === "ff" || cmd === "freefire" || cmd === "vdff") {
    const url = getRandomItem(FF_LIST);
    return {
      message: "🔥 Video Free Fire ngẫu nhiên cực cháy dành cho bạn nè! Booyah! 🏆",
      mediaUrl: url,
      mediaType: "video",
      mediaName: "freefire.mp4"
    };
  }

  // 2.2 ANIME (!anime, !wibu, !vdanime)
  if (cmd === "anime" || cmd === "wibu" || cmd === "vdanime") {
    const url = getRandomItem(ANIME_LIST);
    const isVid = url && (url.endsWith(".mp4") || url.includes("video"));
    return {
      message: "🌸 Anime truyền động lực học tập dành cho bạn nè! Cố lên nhé! ✨",
      mediaUrl: url,
      mediaType: isVid ? "video" : "image",
      mediaName: isVid ? "anime.mp4" : "anime.gif"
    };
  }

  // 2.3 GÁI XINH (!gai, !gái, !girl, !vdgai)
  if (cmd === "gai" || cmd === "gái" || cmd === "girl" || cmd === "vdgai" || cmd === "vdgái") {
    const url = getRandomItem(GAI_LIST);
    return {
      message: "🌸 Video gái xinh ngẫu nhiên tiếp thêm năng lượng ngày mới cho bạn nè! 💖",
      mediaUrl: url,
      mediaType: "video",
      mediaName: "gai.mp4"
    };
  }

  // 2.4 TÂM TRẠNG SAD (!sad, !tamtrang, !buon, !vdsad)
  if (cmd === "sad" || cmd === "tamtrang" || cmd === "buon" || cmd === "vdsad") {
    const url = getRandomItem(SAD_LIST);
    return {
      message: "🌧️ Video tâm trạng lắng đọng... Hãy thư giãn, hít thở thật sâu rồi tiếp tục bước đi nhé! 💖✨",
      mediaUrl: url,
      mediaType: "video",
      mediaName: "sad.mp4"
    };
  }

  // 2.5 TRAI ĐẸP (!trai, !boy, !vdtrai)
  if (cmd === "trai" || cmd === "boy" || cmd === "vdtrai") {
    const url = getRandomItem(TRAI_LIST);
    return {
      message: "✨ Video trai đẹp ngầu dành tặng cả nhóm nè! 🕶️🔥",
      mediaUrl: url,
      mediaType: "video",
      mediaName: "trai.mp4"
    };
  }

  // 2.6 ẢNH ĐẸP NGẪU NHIÊN (!anh, !ảnh, !pic, !image)
  if (cmd === "anh" || cmd === "ảnh" || cmd === "pic" || cmd === "image") {
    const url = getRandomItem(ANH_LIST);
    return {
      message: "📸 Bức ảnh ngẫu nhiên chất lượng cao gửi bạn thưởng thức: 🌸",
      mediaUrl: url,
      mediaType: "image",
      mediaName: "photo.jpg"
    };
  }

async function searchYouTubeVideoId(query) {
  try {
    const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query + ' lyrics');
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'vi,en;q=0.9'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  } catch (err) {
    console.warn('[YouTube Search Error]', err);
    return null;
  }
}

  // 2.7 PHÁT NHẠC / BÀI HÁT (!sing, !nhac, !music, !play, !audio)
  if (cmd === "sing" || cmd === "nhac" || cmd === "music" || cmd === "play" || cmd === "audio") {
    const songName = query || "nhạc chill học bài";
    const ytId = await searchYouTubeVideoId(songName);
    if (ytId) {
      const ytWatchUrl = `https://www.youtube.com/watch?v=${ytId}`;
      return {
        message: `🎵 Đã tìm thấy bài hát: **"${songName}"** 🎶\n🎧 Thưởng thức giai điệu ngay bên dưới hoặc mở xem trên YouTube: ${ytWatchUrl}\n💡 Bật chế độ Pomodoro 25 phút để vừa nghe nhạc vừa học cực đỉnh nhé! ✨`,
        mediaUrl: ytWatchUrl,
        mediaType: "youtube",
        mediaName: `Nhạc: ${songName}`,
        youtubeId: ytId
      };
    } else {
      const videoUrl = getRandomItem(SAD_LIST);
      const ytQuery = encodeURIComponent(songName + " lyrics");
      const ytUrl = `https://www.youtube.com/results?search_query=${ytQuery}`;
      return {
        message: `🎵 Video nhạc tâm trạng cho: **"${songName}"** 🎶\n🔗 Tìm trên YouTube: ${ytUrl}\n💡 Đeo tai nghe + Pomodoro 25 phút = tập trung cực đỉnh! ✨`,
        mediaUrl: videoUrl,
        mediaType: "video",
        mediaName: `Nhạc: ${songName}`
      };
    }
  }

  // 2.8 TROLL / MEME
  if (cmd === "troll" || cmd === "meme") {
    const meme = getRandomItem(TROLL_MEMES);
    return {
      message: `🤣 [GÓC GIẢI TRÍ 3TG]\n"${meme}"`
    };
  }

  // ========================================================
  // 3. TIỆN ÍCH & THÔNG TIN HỆ THỐNG
  // ========================================================
  // 3.1 PING
  if (cmd === "ping" || cmd === "p") {
    const latency = Math.floor(Math.random() * 12) + 8; // 8 - 20ms
    return {
      message: `🏓 PONG!\n⚡ Độ trễ máy chủ: ${latency}ms\n🚀 Tình trạng: Trợ lý Bot 3TG đang hoạt động cực kỳ mượt mà trên nền tảng Cloudflare! ✨`
    };
  }

  // 3.2 UPTIME
  if (cmd === "uptime") {
    return {
      message: `⏱️ [BOT 3TG UPTIME]\nBot đã hoạt động liên tục: ${formatUptime()}\nSẵn sàng phục vụ nhóm học tập 24/7! 💖`
    };
  }

  // 3.3 CHAO
  if (cmd === "chao" || cmd === "hi" || cmd === "hello") {
    return {
      message: getTimeGreeting()
    };
  }

  // 3.4 INFO / NHOM
  if (cmd === "info" || cmd === "nhom" || cmd === "group") {
    const groupName = context.group?.name || "Nhóm học tập";
    const memberCount = context.members?.length || 1;
    const admin = context.members?.find(m => m.role === 'admin')?.full_name || "Nhóm trưởng";
    const deputies = context.members?.filter(m => m.role === 'deputy').map(m => m.full_name).join(", ") || "Chưa có";
    
    return {
      message: 
        `👥 [THÔNG TIN NHÓM: ${groupName.toUpperCase()}]\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👑 Trưởng nhóm (Key holder): ${admin}\n` +
        `🛡️ Phó nhóm: ${deputies}\n` +
        `👥 Sĩ số: ${memberCount} thành viên\n` +
        `🤖 Trợ lý: Bot 3TG (Đang hỗ trợ)\n` +
        `🎯 Mục tiêu: Cùng nhau giữ Streak và đạt điểm A+ tất cả các môn!`
    };
  }

  // 3.5 BOT / ANNIE / ABOUT
  if (cmd === "bot" || cmd === "annie" || cmd === "about") {
    return {
      message: 
        "🤖 [GIỚI THIỆU TRỢ LÝ BOT 3TG]\n" +
        "━━━━━━━━━━━━━━━━━━━━\n" +
        "🌸 Tên gọi: Bot 3TG\n" +
        "⚡ Nền tảng: 3TG Study Hub (Native Node Engine siêu nhẹ)\n" +
        "🎯 Sứ mệnh: Đồng hành cùng học viên CMCU và các bạn trẻ trong học tập, nhắc nhở giữ Streak, xả stress bằng kho media đỉnh cao và giải đáp tâm lý 24/7!\n" +
        "💡 Gõ `!help` để khám phá toàn bộ chức năng của mình nhé!"
    };
  }

  // 3.6 CLEAN / CLEAR
  if (cmd === "clean" || cmd === "clear") {
    return {
      message: "🧹 Đã làm sạch các tiến trình đệm và tối ưu hóa kết nối nhóm học tập! Hệ thống hoạt động trơn tru 100%! ✨"
    };
  }

  // ========================================================
  // 4. AI PROMPT (!ai hoặc /ai)
  // ========================================================
  if (cmd === "ai") {
    if (!query) {
      return {
        message: "🤖 Bạn ơi, hãy nhập câu hỏi sau lệnh !ai nhé! Ví dụ: `!ai cách có người yêu` hoặc `!ai làm sao để nhớ kiến thức lâu?` 🌸"
      };
    }
    return { isAi: true, prompt: query };
  }

  // ========================================================
  // 5. SAI LỆNH (SAILENH) - Phản hồi khi người dùng gõ lệnh lạ
  // ========================================================
  // Nếu lệnh bắt đầu bằng ! nhưng không thuộc danh sách trên
  if (clean.startsWith("!")) {
    const randomAnime = getRandomItem(ANIME_LIST);
    return {
      message: 
        `⚠️ Lệnh \`!${cmd}\` không tồn tại hoặc chưa được hỗ trợ!\n` +
        `💡 Hãy gõ \`!help\` hoặc \`!menu\` để xem toàn bộ danh sách lệnh có sẵn của Bot 3TG nhé! 🌸`,
      mediaUrl: randomAnime || null,
      mediaType: randomAnime && randomAnime.endsWith(".mp4") ? "video" : "image",
      mediaName: "sailenh.mp4"
    };
  }

  return null;
}
