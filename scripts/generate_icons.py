"""Render the original Tasbeeh vector mark into native launcher icon sizes.
Development dependency: Pillow. No image library is shipped with the app.
"""
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
GREEN = '#174E40'
GOLD = '#C9B47D'
IVORY = '#F8F7F2'
size = 2048
image = Image.new('RGB', (size, size), GREEN)
draw = ImageDraw.Draw(image)
scale = 2

def line(points, color, width):
    draw.line([(int(x * scale), int(y * scale)) for x, y in points], fill=color, width=width * scale, joint='curve')

arch = [(232, 800), (232, 443), (237, 395), (259, 352), (306, 305), (364, 265), (430, 221), (512, 158), (594, 221), (660, 265), (718, 305), (765, 352), (787, 395), (792, 443), (792, 800)]
line(arch, GOLD, 5)
svg_parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="{GREEN}"/><polyline points="' + ' '.join(f'{x},{y}' for x, y in arch) + f'" fill="none" stroke="{GOLD}" stroke-width="5" stroke-linejoin="round"/>']
for i in range(26):
    angle = math.radians(62 + i * 12)
    x = 512 + math.cos(angle) * 164
    y = 486 + math.sin(angle) * 160
    radius = 15.5
    draw.ellipse(((x-radius)*scale, (y-radius)*scale, (x+radius)*scale, (y+radius)*scale), fill=IVORY)
    svg_parts.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{radius}" fill="{IVORY}"/>')
for end in [(656, 750), (677, 739), (697, 723)]:
    line([(596, 633), end], GOLD, 7)
    svg_parts.append(f'<path d="M596 633L{end[0]} {end[1]}" stroke="{GOLD}" stroke-width="7"/>')
draw.ellipse((581*scale, 617*scale, 611*scale, 647*scale), fill=GOLD)
svg_parts.append(f'<circle cx="596" cy="632" r="15" fill="{GOLD}"/></svg>')
(ROOT / 'design').mkdir(exist_ok=True)
(ROOT / 'design/app-icon.svg').write_text(''.join(svg_parts) + '\n')
icon_dir = ROOT / 'ios/TasbeehDigitalApp/Images.xcassets/AppIcon.appiconset'
contents = json.loads((icon_dir / 'Contents.json').read_text())
for entry in contents['images']:
    pixels = round(float(entry['size'].split('x')[0]) * float(entry['scale'].removesuffix('x')))
    filename = f'icon-{pixels}.png'
    image.resize((pixels, pixels), Image.Resampling.LANCZOS).save(icon_dir / filename)
    entry['filename'] = filename
(icon_dir / 'Contents.json').write_text(json.dumps(contents, indent=2) + '\n')
for density, pixels in [('mdpi',48), ('hdpi',72), ('xhdpi',96), ('xxhdpi',144), ('xxxhdpi',192)]:
    directory = ROOT / f'android/app/src/main/res/mipmap-{density}'
    for filename in ['ic_launcher.png', 'ic_launcher_round.png']:
        image.resize((pixels, pixels), Image.Resampling.LANCZOS).save(directory / filename)
print('Generated Tasbeeh vector source and native app icons.')
