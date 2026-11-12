const { execSync } = require("child_process");

function getToken() {
  const input = "protocol=https\nhost=github.com\n\n";
  const out = execSync("git credential fill", { input }).toString();
  const m = out.match(/password=(.+)/);
  return m ? m[1].trim() : null;
}

async function main() {
  const token = getToken();
  const res = await fetch("https://api.github.com/repos/Anniehatani/appstudyAI/collaborators", {
    headers: { Authorization: "token " + token, "User-Agent": "Node" }
  });
  const data = await res.json();
  console.log("Collaborators:", data.map(c => c.login));
}

main().catch(console.error);

