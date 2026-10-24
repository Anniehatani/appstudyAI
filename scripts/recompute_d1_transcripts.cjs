const fs = require('fs');

const vars = Object.fromEntries(
  fs.readFileSync('.dev.vars', 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

function isGpaSubject(m) {
  const letter = String(m.diem_chu || '').trim().toUpperCase();
  if (['P', 'NP', 'ĐẠT', 'DAT', 'M', 'MIỄN', 'MIEN', 'KĐ', 'KD', 'I', 'W', 'CHƯA CÓ ĐIỂM', ''].includes(letter)) {
    return false;
  }
  const name = String(m.ten_hoc_phan || m.ten_mon || '').toLowerCase();
  const code = String(m.ma_mon || '').toUpperCase();
  if (/thể dục|thể chất|đá cầu|bóng rổ|bóng chuyền|bóng bàn|bơi lội|điền kinh|quốc phòng|an ninh|gdqp/i.test(name)) {
    return false;
  }
  if (/^GENE101[0-9]/.test(code) || /^MIL/.test(code)) {
    return false;
  }
  if (/^ENG-100[1-9]/.test(code) && (Number(m.diem_he_4) === 0 || letter === 'P')) {
    return false;
  }
  return true;
}

function processAcademicTranscript(bangDiemRaw, studentInfo = {}, activeCourses = []) {
  const list = Array.isArray(bangDiemRaw) ? bangDiemRaw : [];

  const semesterMap = new Map();
  let totalCredits10 = 0;
  let totalWeighted10 = 0;
  let totalCredits4 = 0;
  let totalWeighted4 = 0;
  let totalPassedCredits = 0;

  for (const m of list) {
    const credits = Number(m.so_tin_chi) || 3;
    const score10 = Number.isFinite(Number(m.diem_he_10)) ? Number(m.diem_he_10) : 0;
    const score4 = Number.isFinite(Number(m.diem_he_4)) ? Number(m.diem_he_4) : 0;
    const letter = String(m.diem_chu || "B").trim().toUpperCase();
    const passed = (score10 >= 4.0 || letter === "P" || letter === "ĐẠT") && letter !== "F" && letter !== "NP";
    const countsInGpa = isGpaSubject(m);

    const semName = (m.hoc_ky ? `${m.hoc_ky}` : "Học kỳ") + (m.nam_hoc ? ` - Năm học ${m.nam_hoc}` : "");
    if (!semesterMap.has(semName)) {
      semesterMap.set(semName, {
        semester_name: semName,
        hoc_ky: m.hoc_ky || "",
        nam_hoc: m.nam_hoc || "",
        subjects: [],
        total_credits: 0,
        gpa_credits: 0,
        gpa_10: 0,
        gpa_4: 0,
        weighted_10: 0,
        weighted_4: 0
      });
    }

    const sem = semesterMap.get(semName);
    sem.subjects.push({
      ma_mon: m.ma_mon || "",
      ten_hoc_phan: m.ten_hoc_phan || "Học phần",
      so_tin_chi: credits,
      diem_he_10: score10,
      diem_he_4: score4,
      diem_chu: letter,
      passed,
      countsInGpa,
      chi_tiet_diem: m.chi_tiet_diem || {}
    });

    sem.total_credits += credits;
    if (countsInGpa) {
      sem.gpa_credits += credits;
      sem.weighted_10 += score10 * credits;
      sem.weighted_4 += score4 * credits;

      totalCredits10 += credits;
      totalWeighted10 += score10 * credits;
      totalCredits4 += credits;
      totalWeighted4 += score4 * credits;
    }

    if (passed && countsInGpa) {
      totalPassedCredits += credits;
    }
  }

  const semesters = [];
  for (const [, sem] of semesterMap.entries()) {
    sem.gpa_10 = sem.gpa_credits > 0 ? Math.round((sem.weighted_10 / sem.gpa_credits) * 100) / 100 : 0;
    sem.gpa_4 = sem.gpa_credits > 0 ? Math.round((sem.weighted_4 / sem.gpa_credits) * 100) / 100 : 0;
    semesters.push(sem);
  }

  const overallGpa10 = totalCredits10 > 0 ? Math.round((totalWeighted10 / totalCredits10) * 100) / 100 : 0;
  const overallGpa4 = totalCredits4 > 0 ? Math.round((totalWeighted4 / totalCredits4) * 100) / 100 : 0;

  let classification = "Chưa xếp loại";
  let badgeColor = "#ff7597";
  if (overallGpa4 >= 3.6) {
    classification = "Xuất sắc 🏆";
    badgeColor = "#e60049";
  } else if (overallGpa4 >= 3.2) {
    classification = "Giỏi 🌟";
    badgeColor = "#ff4d80";
  } else if (overallGpa4 >= 2.5) {
    classification = "Khá ✨";
    badgeColor = "#00b4d8";
  } else if (overallGpa4 >= 2.0) {
    classification = "Trung bình ⚠️";
    badgeColor = "#f59e0b";
  } else if (totalCredits4 > 0) {
    classification = "Yếu / Cảnh báo 🚨";
    badgeColor = "#ef4444";
  }

  const weakSubjects = list
    .filter(m => {
      if (!isGpaSubject(m)) return false;
      const score = Number(m.diem_he_10) || 0;
      const letter = String(m.diem_chu || "").toUpperCase();
      return score < 7.0 || ["F", "D", "D+", "C", "C+"].includes(letter);
    })
    .map(m => {
      const credits = Number(m.so_tin_chi) || 3;
      const score4 = Number(m.diem_he_4) || 0;
      const gpaGainIfA = totalCredits4 > 0 ? Math.round(((4.0 - score4) * credits / totalCredits4) * 100) / 100 : 0;
      return {
        ma_mon: m.ma_mon,
        ten_hoc_phan: m.ten_hoc_phan,
        so_tin_chi: credits,
        diem_he_10: Number(m.diem_he_10) || 0,
        diem_he_4: score4,
        diem_chu: m.diem_chu,
        hoc_ky: m.hoc_ky,
        nam_hoc: m.nam_hoc,
        chi_tiet_diem: m.chi_tiet_diem || {},
        gpaGainIfA
      };
    })
    .sort((a, b) => b.gpaGainIfA - a.gpaGainIfA);

  return {
    student: {
      ma_sinh_vien: studentInfo.ma_sinh_vien || "",
      ho_ten: studentInfo.ho_ten || "Sinh viên CMC",
      nganh: studentInfo.nganh || "Công nghệ thông tin",
      lop: studentInfo.lop || "",
      email: studentInfo.email || "",
      khoa: studentInfo.khoa || "",
      ngay_sinh: studentInfo.ngay_sinh || ""
    },
    gpa: {
      overall_10: overallGpa10,
      overall_4: overallGpa4,
      total_credits: totalCredits4,
      passed_credits: totalPassedCredits,
      classification,
      badgeColor,
      total_subjects: list.length,
      weak_count: weakSubjects.length
    },
    semesters,
    weak_subjects: weakSubjects,
    active_courses: Array.isArray(activeCourses) ? activeCourses : [],
    raw_subjects: list
  };
}

async function run() {
  const accountId = vars.CLOUDFLARE_ACCOUNT_ID;
  const dbId = vars.CLOUDFLARE_D1_DATABASE_ID;
  const token = vars.CLOUDFLARE_API_TOKEN;

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: "SELECT user_id, raw_data FROM user_academic_transcripts" })
  });
  const data = await res.json();
  const rows = data.result?.[0]?.results || [];

  for (const row of rows) {
    if (!row.raw_data) continue;
    const oldParsed = JSON.parse(row.raw_data);
    const rawSubs = oldParsed.raw_subjects || [];
    if (!rawSubs.length) continue;

    const reprocessed = processAcademicTranscript(rawSubs, oldParsed.student, oldParsed.active_courses);
    console.log(`Updating user ${row.user_id}:`);
    console.log(`  Old GPA 4: ${oldParsed.gpa.overall_4} -> New GPA 4: ${reprocessed.gpa.overall_4}`);
    console.log(`  Old GPA 10: ${oldParsed.gpa.overall_10} -> New GPA 10: ${reprocessed.gpa.overall_10}`);
    console.log(`  Old Credits: ${oldParsed.gpa.total_credits} -> New Credits: ${reprocessed.gpa.total_credits}`);

    const updateSql = `
      UPDATE user_academic_transcripts
      SET gpa_4 = ?, gpa_10 = ?, total_credits = ?, raw_data = ?
      WHERE user_id = ?
    `;

    const updateRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: updateSql,
        params: [
          reprocessed.gpa.overall_4,
          reprocessed.gpa.overall_10,
          reprocessed.gpa.total_credits,
          JSON.stringify(reprocessed),
          row.user_id
        ]
      })
    });
    const updateJson = await updateRes.json();
    console.log(`  Result:`, updateJson.success ? "SUCCESS" : updateJson.errors);
  }
}

run().catch(console.error);
