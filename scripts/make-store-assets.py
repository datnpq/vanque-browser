# Vân Quẻ · tạo ảnh tile cho gói MSIX / Microsoft Store từ build/icon.png
# Chạy: python scripts/make-store-assets.py   (cần Pillow)
import sys
from pathlib import Path
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parent.parent
SRC = Image.open(ROOT / 'build' / 'icon.png').convert('RGBA')
OUT = ROOT / 'build' / 'appx'
OUT.mkdir(parents=True, exist_ok=True)
BG = SRC.getpixel((6, 6))  # màu giấy dó ở góc ảnh gốc

# Ở cỡ nhỏ chỉ giữ con dấu VQ cho dễ nhìn; cỡ lớn giữ cả mây
STAMP = SRC.crop((88, 88, 424, 424))


def square(size, src):
    return src.resize((size, size), Image.LANCZOS)


def wide(w, h):
    img = Image.new('RGBA', (w, h), BG)
    logo = square(int(h * 0.92), SRC)
    img.alpha_composite(logo, ((w - logo.width) // 2, (h - logo.height) // 2))
    return img


def save(img, name):
    img.save(OUT / name, optimize=True)


for scale in (100, 125, 150, 200, 400):
    k = scale / 100
    sfx = '' if scale == 100 else f'.scale-{scale}'
    save(square(round(44 * k), STAMP), f'Square44x44Logo{sfx}.png')
    save(square(round(50 * k), STAMP), f'StoreLogo{sfx}.png')
    save(square(round(71 * k), STAMP), f'SmallTile{sfx}.png')
    save(square(round(150 * k), SRC), f'Square150x150Logo{sfx}.png')
    save(square(round(310 * k), SRC), f'LargeTile{sfx}.png')
    save(wide(round(310 * k), round(150 * k)), f'Wide310x150Logo{sfx}.png')

# Biểu tượng thanh tác vụ / menu Start (không có nền tile)
for t in (16, 24, 32, 48, 256):
    icon = square(t, STAMP)
    save(icon, f'Square44x44Logo.targetsize-{t}.png')
    save(icon, f'Square44x44Logo.targetsize-{t}_altform-unplated.png')

print('Đã tạo', len(list(OUT.glob('*.png'))), 'ảnh trong', OUT)
