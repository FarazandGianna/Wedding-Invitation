#!/usr/bin/env python3
"""
Regenerate all raster monogram assets from the couple's approved
'public/monogram 2.png' (transparent 3D Baroque "GF" artwork).

The transparent PNG is preserved for in-UI use (monogram.png); here we
composite it onto the wine background (#360b14) and SIZE IT UP (small margin)
for the favicon / PWA icons / apple-touch-icon / og-image.

Run:  python3 tools/make-icons.py
"""
from PIL import Image, ImageOps

WINE = (0x36, 0x0B, 0x14, 0xFF)        # #360b14
SRC = Image.open("public/monogram 2.png").convert("RGBA")
SRC = ImageOps.crop(SRC, border=0)     # no-op safety; bbox already near-full
SW, SH = SRC.size                      # 1024 x 1536, aspect 2:3

# (path, canvas_w, canvas_h, margin_fraction)
TARGETS = [
    ("public/favicon.png",        512,  512, 0.06),
    ("public/icon-192.png",       192,  192, 0.06),
    ("public/icon-512.png",       512,  512, 0.06),
    ("public/apple-touch-icon.png", 180, 180, 0.06),
    ("public/og-image.png",      1200,  630, 0.04),
]

def render(path, cw, ch, margin_frac):
    canvas = Image.new("RGBA", (cw, ch), WINE)
    avail_w = cw * (1 - 2 * margin_frac)
    avail_h = ch * (1 - 2 * margin_frac)
    # Fit the portrait monogram by the constraining dimension (height for
    # square icons, width for landscape og-image) so it is as large as possible.
    scale = min(avail_w / SW, avail_h / SH)
    new_w = int(round(SW * scale))
    new_h = int(round(SH * scale))
    mono = SRC.resize((new_w, new_h), Image.LANCZOS)
    x = (cw - new_w) // 2
    y = (ch - new_h) // 2
    canvas.alpha_composite(mono, (x, y))
    # Flatten to RGB (drop alpha) for broad compatibility
    out = Image.new("RGB", (cw, ch), WINE[:3])
    out.paste(canvas, (0, 0), canvas)
    out.save(path, "PNG", optimize=True)
    print(f"  {path:32s} {cw}x{ch}  mono {new_w}x{new_h} @({x},{y})")

print("Regenerating raster monogram assets from monogram 2.png...")
for t in TARGETS:
    render(*t)
print("done.")
