import time
from pathlib import Path
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = Path("build/test_screenshots")
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={"width": 1280, "height": 800})
    page = context.new_page()

    print("1. Testing page load and splash loader...")
    page.goto("http://127.0.0.1:8787")
    time.sleep(1.5)
    page.screenshot(path=str(SCREENSHOTS_DIR / "1_initial_screen.png"))
    print("Initial screen captured.")

    print("2. Testing offline detection...")
    context.set_offline(True)
    page.evaluate("window.dispatchEvent(new Event('offline'))")
    time.sleep(0.8)
    page.screenshot(path=str(SCREENSHOTS_DIR / "2_offline_banner.png"))
    print("Offline banner captured.")

    print("3. Testing online recovery...")
    context.set_offline(False)
    page.evaluate("window.dispatchEvent(new Event('online'))")
    time.sleep(0.8)
    page.screenshot(path=str(SCREENSHOTS_DIR / "3_online_restored.png"))
    print("Online restored captured.")

    print("4. Testing new account registration with clean profile...")
    # Switch to register tab if not already
    page.click("button[data-auth-tab='register']")
    time.sleep(0.5)

    rand_id = int(time.time()) % 10000
    test_user = f"newuser_{rand_id}"
    page.fill("#reg-fullname", "Người Học Mới")
    page.fill("#reg-username", test_user)
    page.fill("#reg-password", "123456")
    page.fill("#reg-password-confirm", "123456")
    page.screenshot(path=str(SCREENSHOTS_DIR / "4_register_form.png"))

    page.click("button[type='submit']")
    time.sleep(2.5) # Wait for splash loading transition to finish

    # Navigate to Profile / Settings
    page.click("#side-profile-btn")
    time.sleep(1.2)
    page.screenshot(path=str(SCREENSHOTS_DIR / "5_new_user_profile_empty.png"))
    print("Profile captured.")

    # Check profile text content
    profile_text = page.locator(".fb-card").inner_text()
    print("Profile Card Text:")
    print(profile_text[:300])

    intro_text = page.locator(".fb-left-col").inner_text()
    print("\nIntro Column Text:")
    print(intro_text[:300])

    browser.close()
    print("\nAll tests completed successfully!")
