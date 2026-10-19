import pymupdf

doc = pymupdf.open(r"c:\Users\LeVanAn\Documents\ChatGPT\app study 2\tổng kết sprint 1\erd.pdf")
page = doc[0]

text_instances = []
for word in page.get_text("words"):
    # words format: (x0, y0, x1, y1, word, block_no, line_no, word_no)
    if word[4] in ("1", "*"):
        text_instances.append(word)

print(f"Total '1' and '*' text markers: {len(text_instances)}")
for t in text_instances:
    print(f"Marker '{t[4]}' at x={t[0]:.1f}, y={t[1]:.1f}")
