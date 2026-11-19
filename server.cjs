const { startEmbeddedServer } = require("./electron/embedded-server.cjs");

const PORT = process.env.PORT || 8787;

startEmbeddedServer(process.cwd(), PORT).then(({ url }) => {
  console.log("\n==================================================");
  console.log(`🚀 3TG Study Web đang chạy tại: ${url}`);
  console.log(`👉 Truy cập trình duyệt: ${url}`);
  console.log("==================================================\n");
}).catch((err) => {
  console.error("Lỗi khi khởi động web server:", err);
  process.exit(1);
});
