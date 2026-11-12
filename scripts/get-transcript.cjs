const fs = require("fs");
const { execSync } = require("child_process");

const out = execSync(`npx wrangler d1 execute app-study-db --remote --command "SELECT raw_data FROM user_academic_transcripts WHERE user_id = 'd6fe9be1-8be9-43af-9b6a-ac2cfdd0eccc';" --json`, { maxBuffer: 10 * 1024 * 1024 });
const parsed = JSON.parse(out.toString());
const rawDataStr = parsed[0]?.results[0]?.raw_data;
if (rawDataStr) {
  const data = JSON.parse(rawDataStr);
  console.log("Top-level keys:", Object.keys(data));
  const prog = (data.raw_subjects || []).find(s => s.ma_mon && s.ma_mon.includes("PROG2005"));
  console.log("PROG2005 subject:", JSON.stringify(prog, null, 2));
  fs.writeFileSync("scripts/cmc_raw_data.json", JSON.stringify(data, null, 2));
  console.log("Saved cmc_raw_data.json");
} else {
  console.log("No raw_data found for user in remote D1!");
}
