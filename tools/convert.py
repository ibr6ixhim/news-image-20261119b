#!/usr/bin/env python3
"""Convert generated WebP photos to deterministic indexed-colour assets.

Each asset is two files: <name>.idx (one palette-index byte per pixel,
row-major) and <name>.pal (256 RGB triples). Deterministic: same input
bytes -> same output bytes. No randomness, no timestamps.
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEN = os.path.join(ROOT, "gen")
OUT = os.path.join(ROOT, "assets")

# (source webp, asset name, target width, target height)
JOBS = [
    ("media-generation-hero-gulf-0-b15601b9-c918-407a-9c53-5bd5c8b442f2.webp", "hero", 488, 282),
    ("media-generation-kerch-bridge-0-f228a4c4-e97a-4312-8e36-adda491561b9.webp", "kerch", 480, 116),
    ("media-generation-anthropic-nasdaq-0-a060a8a3-f4bf-4a9f-9b94-865e97a3fa7a.webp", "anthropic", 480, 116),
    ("media-generation-gta-vice-city-0-a25112c0-cb81-4d5e-a4a8-cc0e4d92e638.webp", "gta", 304, 88),
    ("media-generation-gaza-families-0-d5443366-7735-4327-978c-476087b2dc9b.webp", "gaza", 304, 88),
    ("media-generation-voyager-space-0-f87d7d23-3159-46da-8ec1-3195f4dd5058.webp", "voyager", 304, 88),
]


def crop_resize(im, w, h):
    """Center-crop to the target aspect, then resize with Lanczos."""
    sw, sh = im.size
    ta = w / h
    sa = sw / sh
    if sa > ta:  # too wide: crop sides
        nw = int(sh * ta)
        x0 = (sw - nw) // 2
        im = im.crop((x0, 0, x0 + nw, sh))
    else:  # too tall: crop top/bottom
        nh = int(sw / ta)
        y0 = (sh - nh) // 2
        im = im.crop((0, y0, sw, y0 + nh))
    return im.resize((w, h), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    total = 0
    for src, name, w, h in JOBS:
        im = Image.open(os.path.join(GEN, src)).convert("RGB")
        im = crop_resize(im, w, h)
        q = im.quantize(colors=256, method=Image.Quantize.MEDIANCUT,
                        dither=Image.Dither.FLOYDSTEINBERG)
        pal = q.getpalette()[:768]
        idx = q.tobytes()
        assert len(idx) == w * h, (name, len(idx), w * h)
        assert len(pal) == 768, (name, len(pal))
        with open(os.path.join(OUT, name + ".idx"), "wb") as f:
            f.write(idx)
        with open(os.path.join(OUT, name + ".pal"), "wb") as f:
            f.write(bytes(pal))
        total += len(idx) + len(pal)
        print(f"{name}: {w}x{h} idx={len(idx)} pal={len(pal)}")
    print(f"total asset bytes: {total}")


if __name__ == "__main__":
    main()
