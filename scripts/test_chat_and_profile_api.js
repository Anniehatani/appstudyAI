async function run() {
  const cookie = "lumi_session=d6fe9be1-8be9-43af-9b6a-ac2cfdd0eccc";

  console.log("\n=== 1. TEST GET /api/overview ===");
  const ovRes = await fetch("http://127.0.0.1:8787/api/overview", {
    headers: { "Cookie": cookie }
  });
  const ov = await ovRes.json();
  console.log("Overview Profile:", {
    full_name: ov.profile?.full_name,
    username: ov.profile?.username,
    school: ov.profile?.school,
    major: ov.profile?.major,
    bio: ov.profile?.bio,
    created_at: ov.profile?.created_at,
    league: ov.league,
    completedCount: ov.completedCount
  });

  console.log("\n=== 2. TEST PATCH /api/profile (Real DB fields) ===");
  const patchRes = await fetch("http://127.0.0.1:8787/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Cookie": cookie },
    body: JSON.stringify({
      fullName: "Lê Văn An",
      bio: "Học viên chăm chỉ tại Lumi",
      school: "Đại học Bách Khoa",
      major: "Công nghệ Thông tin"
    })
  });
  const patchData = await patchRes.json();
  console.log("PATCH response profile:", patchData.profile);

  console.log("\n=== 3. VERIFY /api/overview AFTER PATCH ===");
  const ovRes2 = await fetch("http://127.0.0.1:8787/api/overview", {
    headers: { "Cookie": cookie }
  });
  const ov2 = await ovRes2.json();
  console.log("Updated Profile in overview:", {
    full_name: ov2.profile?.full_name,
    school: ov2.profile?.school,
    major: ov2.profile?.major,
    bio: ov2.profile?.bio,
    created_at: ov2.profile?.created_at
  });

  console.log("\n=== 4. TEST POST /api/chat ===");
  const chatRes = await fetch("http://127.0.0.1:8787/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cookie": cookie },
    body: JSON.stringify({
      message: "Chào bạn",
      subjectId: ov2.subjects && ov2.subjects[0] ? ov2.subjects[0].id : 1
    })
  });
  const chatData = await chatRes.json();
  console.log("Chat response status:", chatRes.status);
  console.log("Chat reply preview:\n", chatData.reply ? chatData.reply.slice(0, 200) + "..." : "No reply");
}

run().catch(console.error);
