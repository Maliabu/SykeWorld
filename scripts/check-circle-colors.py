"""Check what colors are inside the circle"""
from PIL import Image
import math
from collections import Counter

def find_circle_center_and_radius(img):
    """Find the center and radius of the circle"""
    pixels = img.load()
    width, height = img.size
    
    min_x, min_y = width, height
    max_x, max_y = 0, 0
    
    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] > 0:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    
    center_x = (min_x + max_x) // 2
    center_y = (min_y + max_y) // 2
    radius = min((max_x - min_x) // 2, (max_y - min_y) // 2)
    
    return center_x, center_y, radius

def is_inside_circle(x, y, center_x, center_y, radius):
    """Check if point is inside the circle"""
    dx = x - center_x
    dy = y - center_y
    distance = math.sqrt(dx*dx + dy*dy)
    return distance <= radius

img = Image.open("logo (1).png").convert("RGBA")
pixels = img.load()
center_x, center_y, radius = find_circle_center_and_radius(img)

colors_inside = Counter()
total_inside = 0

for y in range(img.size[1]):
    for x in range(img.size[0]):
        r, g, b, a = pixels[x, y]
        if a > 0 and is_inside_circle(x, y, center_x, center_y, radius):
            colors_inside[(r, g, b)] += 1
            total_inside += 1

print(f"Total pixels inside circle: {total_inside}")
print(f"\nTop colors inside circle:")
for color, count in colors_inside.most_common(15):
    print(f"  RGB{color}: {count} pixels ({count*100/total_inside:.1f}%)")
