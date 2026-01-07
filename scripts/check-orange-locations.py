"""Check where orange pixels are located"""
from PIL import Image
import math

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

def is_orange_pixel(r, g, b):
    """Check if pixel is orange"""
    if r > 120 and g > 30 and b < 120:
        if r > g and r > b:
            return True
    if r > 180 and g > 80 and b < 100:
        return True
    if r > 150 and 50 <= g <= 200 and b < 150:
        if (r - g) > 20 and (r - b) > 50:
            return True
    if r > 200 and 100 <= g <= 180 and b < 80:
        return True
    return False

img = Image.open("logo (1).png").convert("RGBA")
pixels = img.load()
center_x, center_y, radius = find_circle_center_and_radius(img)

orange_inside = 0
orange_outside = 0

for y in range(img.size[1]):
    for x in range(img.size[0]):
        r, g, b, a = pixels[x, y]
        if a > 0 and is_orange_pixel(r, g, b):
            if is_inside_circle(x, y, center_x, center_y, radius):
                orange_inside += 1
            else:
                orange_outside += 1

print(f"Orange pixels inside circle: {orange_inside}")
print(f"Orange pixels outside circle: {orange_outside}")
