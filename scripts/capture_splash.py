import time
from pathlib import Path
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = Path("build/test_screenshots")

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={"width": 1280, "height": 800})
    page = context.new_page()

    page.goto("http://127.0.0.1:8787")
    # Show the splash loader manually to capture it nicely
    page.evaluate("window.showAppLoader('Thỏ Bảy Màu đang chuẩn bị bài giảng siêu cuốn cho bạn… 🌸', 'Nạp năng lượng và đồng bộ 29.000 câu hỏi từ Cloudflare D1… ✨')")
    page.evaluate("window.setAppLoaderProgress(68)")
    time.sleep(0.5)

    page.screenshot(path=str(SCREENSHOTS_DIR / "6_mascot_splash_loader.png"))
    browser.close()
    print("Mascot splash loader screenshot saved!")
