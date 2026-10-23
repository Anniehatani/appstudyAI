import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SVG_PATH = PROJECT_ROOT / "logo" / "3tg-icon.svg"
BUILD_DIR = PROJECT_ROOT / "build"
BUILD_DIR.mkdir(exist_ok=True)

PNG_PATH = BUILD_DIR / "icon.png"
PNG_512_PATH = BUILD_DIR / "icon-512.png"
ICO_PATH = BUILD_DIR / "icon.ico"

svg_content = SVG_PATH.read_text(encoding="utf-8")

# Prepare an HTML wrapper that renders just the squircle icon at 512x512
# The svg viewBox is 0 0 126 126, which frames the icon squircle perfectly.
html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{
    margin: 0;
    padding: 0;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 512px;
    height: 512px;
    overflow: hidden;
  }}
  svg {{
    width: 512px;
    height: 512px;
  }}
</style>
</head>
<body>
{svg_content.replace('width="380"', 'width="512"').replace('height="130"', 'height="512"')}
</body>
</html>
"""

temp_html = BUILD_DIR / "_temp_icon.html"
temp_html.write_text(html_content, encoding="utf-8")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 512, "height": 512})
    page.goto(temp_html.as_uri())
    page.screenshot(path=str(PNG_512_PATH), omit_background=True)
    browser.close()

if temp_html.exists():
    temp_html.unlink()

# Generate multi-size ICO using PIL
img = Image.open(PNG_512_PATH)
img.resize((256, 256), Image.Resampling.LANCZOS).save(PNG_PATH, "PNG")

icon_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
img.save(ICO_PATH, format="ICO", sizes=icon_sizes)

print("Successfully generated icon files:")
print("-", PNG_PATH, f"({PNG_PATH.stat().st_size} bytes)")
print("-", PNG_512_PATH, f"({PNG_512_PATH.stat().st_size} bytes)")
print("-", ICO_PATH, f"({ICO_PATH.stat().st_size} bytes)")
