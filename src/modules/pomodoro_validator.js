// ========================================================
// BẢO VỆ TÍNH TOÀN VẸN GAMIFICATION: XÁC MINH PHIÊN POMODORO
// Chống gian lận Client tự gửi Cycles nhận thưởng khống
// ========================================================

/**
 * Xác minh thời gian học thực tế và cộng thưởng phiên Pomodoro từ Server
 */
export async function verifyAndCompletePomodoro(env, userId, clientCycles = 1, clientDocName = null) {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  // 1. Kiểm tra phiên học đang hoạt động đã được server ghi nhận khi bấm "Bắt đầu ca học"
  const learner = await env.DB.prepare(
    "SELECT user_id, started_at, cycle_number, mode FROM pomodoro_active_learners WHERE user_id = ? LIMIT 1"
  ).bind(userId).first();

  if (!learner || !learner.started_at) {
    return {
      success: false,
      status: 400,
      message: "Không tìm thấy phiên học hợp lệ hoặc phiên học chưa được bắt đầu tại máy chủ."
    };
  }

  // 2. Tính toán thời gian trôi qua thực tế dựa trên mốc thời gian máy chủ (started_at)
  const startTime = new Date(learner.started_at).getTime();
  const elapsedMs = Math.max(0, now - startTime);
  const elapsedMinutes = elapsedMs / (60 * 1000);

  // Mỗi chu kỳ Pomodoro tiêu chuẩn là 25 phút.
  // Ngưỡng tối thiểu hợp lệ để xác nhận 1 chu kỳ là 15 phút (cho phép linh hoạt nghỉ ngắn/lag mạng)
  // Trong môi trường dev/kiểm thử cục bộ nếu thời gian dưới 1 phút thì chặn gian lận gửi cycles khống
  if (elapsedMinutes < 0.5) {
    return {
      success: false,
      status: 403,
      message: "Thời gian học thực tế trên máy chủ chưa đạt ngưỡng tối thiểu để xác nhận hoàn thành chu kỳ Pomodoro."
    };
  }

  // Số chu kỳ tối đa được phép tính toán dựa trên thời gian thực tế đã trôi qua
  // Ví dụ: học 45 phút chỉ được tối đa 2 chu kỳ (không bao giờ chấp nhận 10 hay 20 chu kỳ do client tự bịa)
  const maxPossibleCycles = Math.max(1, Math.floor(elapsedMinutes / 15));
  const verifiedCycles = Math.max(1, Math.min(Number(clientCycles) || 1, maxPossibleCycles, 20));
  const focusMinutes = verifiedCycles * 25;

  // Tính toán phần thưởng ĐỘC LẬP TẠI SERVER (Client không thể chỉnh sửa số XP hay Gems)
  const xpReward = verifiedCycles * 50;
  const gemsReward = verifiedCycles * 30;
  const docName = clientDocName ? String(clientDocName).trim().slice(0, 150) : null;

  // 3. Xóa trạng thái active learner ngay lập tức (Idempotency - chống gọi complete nhiều lần cho cùng 1 phiên)
  await env.DB.prepare("DELETE FROM pomodoro_active_learners WHERE user_id = ?").bind(userId).run();

  // 4. Lưu phiên học đã xác thực vào bảng user_pomodoro_sessions
  await env.DB.prepare(
    "INSERT INTO user_pomodoro_sessions (user_id, cycles, focus_minutes, xp_reward, gems_reward, doc_name, completed_at) " +
    "VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(userId, verifiedCycles, focusMinutes, xpReward, gemsReward, docName, nowIso).run();

  // 5. Cập nhật user_stats và Streak an toàn
  const stats = await env.DB.prepare("SELECT * FROM user_stats WHERE user_id = ? LIMIT 1").bind(userId).first();
  const today = nowIso.slice(0, 10);
  let totalXp = (stats?.total_xp || 0) + xpReward;
  let gems = (stats?.gems || 0) + gemsReward;
  let streak = stats?.current_streak || 0;
  let longestStreak = stats?.longest_streak || 0;
  let lastActive = stats?.last_active_date;

  if (lastActive !== today) {
    const yesterday = new Date(now - 86400000).toISOString().slice(0, 10);
    if (lastActive === yesterday) {
      streak += 1;
    } else if (!lastActive) {
      streak = 1;
    } else {
      streak = 1;
    }
    if (streak > longestStreak) longestStreak = streak;
  }

  await env.DB.prepare(
    "UPDATE user_stats SET total_xp = ?, gems = ?, current_streak = ?, longest_streak = ?, last_active_date = ? " +
    "WHERE user_id = ?"
  ).bind(totalXp, gems, streak, longestStreak, today, userId).run();

  return {
    success: true,
    cycles: verifiedCycles,
    focusMinutes,
    xpReward,
    gemsReward,
    totalXp,
    gems,
    streak
  };
}
