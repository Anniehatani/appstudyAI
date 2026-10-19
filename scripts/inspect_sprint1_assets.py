import pymupdf
import os
from PIL import Image

folder = r"c:\Users\LeVanAn\Documents\ChatGPT\app study 2\tổng kết sprint 1"
pdf_path = os.path.join(folder, "erd.pdf")
doc = pymupdf.open(pdf_path)
print(f"Total pages in erd.pdf: {len(doc)}")

for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=200)
    out_path = os.path.join(folder, f"erd_page_{i+1}.png")
    pix.save(out_path)
    print(f"Rendered page {i+1} -> {out_path} ({pix.width}x{pix.height})")

print("\n--- Image files in folder ---")
for f in sorted(os.listdir(folder)):
    if f.lower().endswith(('.png', '.jpg', '.jpeg')):
        full_path = os.path.join(folder, f)
        with Image.open(full_path) as img:
            print(f"{f}: {img.size}, mode={img.mode}")
