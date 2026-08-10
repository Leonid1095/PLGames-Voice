#!/usr/bin/env python3
"""Build assets/desktop/icon.icns from icon.png.

macOS is the only platform whose Forge maker wants an .icns, and the file had
never been in the repo — forge.config.ts referenced it anyway, so every macOS
run of Desktop Multi-Platform Build failed on it. Regenerate with this script
whenever icon.png changes; there is no macOS `iconutil` in CI or on the dev
host, so the container is written directly.

Usage:  python3 scripts/gen-icns.py
"""
import io
import struct
from pathlib import Path

from PIL import Image

ASSETS = Path(__file__).resolve().parent.parent / "assets" / "desktop"
SRC = ASSETS / "icon.png"
DST = ASSETS / "icon.icns"

# ICNS entry types mapped to their pixel size. Modern macOS reads embedded PNG
# directly, so no legacy RLE encoding is needed. ic10 (1024px) is skipped
# deliberately: the source is 512px and upscaling would only add blur.
ENTRIES = [
    (b"ic07", 128),  # 128x128
    (b"ic08", 256),  # 256x256
    (b"ic09", 512),  # 512x512
    (b"ic11", 32),   # 16x16@2x
    (b"ic12", 64),   # 32x32@2x
    (b"ic13", 256),  # 128x128@2x
    (b"ic14", 512),  # 256x256@2x
]


def main() -> None:
    src = Image.open(SRC).convert("RGBA")
    chunks = []
    for typ, size in ENTRIES:
        img = src if size == src.size[0] else src.resize((size, size), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
        data = buf.getvalue()
        # Each entry is type(4) + length(4, counting these 8 bytes) + payload.
        chunks.append(typ + struct.pack(">I", len(data) + 8) + data)

    body = b"".join(chunks)
    DST.write_bytes(b"icns" + struct.pack(">I", len(body) + 8) + body)
    print(f"wrote {DST} ({DST.stat().st_size} bytes, {len(ENTRIES)} sizes)")


if __name__ == "__main__":
    main()
