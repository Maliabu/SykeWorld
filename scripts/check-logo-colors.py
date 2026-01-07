"""Check what colors are actually in the logo"""
from PIL import Image
import math
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
web_dir = os.path.dirname(script_dir)
logo_path = os.path.join(web_dir, "public", "images", "logo (1).png")

img = Image.open(logo_path).convert('RGBA')
pixels = img.load()
w, h = img.size
cx, cy, r = 461, 320, 310

green = 0
navy = 0
other = 0
other_samples = set()

for y in range(h):
    for x in range(w):
        distance = math.sqrt((x - cx)**2 + (y - cy)**2)
        if distance <= r:
            r_val, g_val, b_val, a = pixels[x, y]
            
            if a == 0:
                continue
            
            if abs(r_val - 34) < 30 and abs(g_val - 139) < 30 and abs(b_val - 34) < 30:
                green += 1
            elif r_val < 50 and g_val < 50 and b_val > 80:
                navy += 1
            else:
                other += 1
                if len(other_samples) < 20:
                    other_samples.add((r_val, g_val, b_val))

print(f'Inside circle: Green={green}, Navy={navy}, Other={other}')
print(f'Other color samples: {list(other_samples)[:20]}')
