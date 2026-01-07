"""
Fix logo (1).png - ensure all water areas inside circle are navy blue
"""
from PIL import Image
import math
import os

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

def get_navy_blue_from_reference():
    """Get navy blue color from logo.png"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(script_dir)
    logo_ref_path = os.path.join(web_dir, "public", "images", "logo.png")
    
    if os.path.exists(logo_ref_path):
        ref_img = Image.open(logo_ref_path).convert("RGBA")
        ref_pixels = ref_img.load()
        
        navy_colors = []
        for y in range(ref_img.size[1]):
            for x in range(ref_img.size[0]):
                r, g, b, a = ref_pixels[x, y]
                if a > 0:
                    if r < 100 and g < 100 and b > 50 and b > r and b > g:
                        navy_colors.append((r, g, b))
        
        if navy_colors:
            from collections import Counter
            color_counts = Counter(navy_colors)
            navy_color = color_counts.most_common(1)[0][0]
            print(f"Using navy blue from logo.png: {navy_color}")
            return navy_color
    
    return (0, 32, 96)

def fix_water_areas(img):
    """Make sure all non-green, non-transparent pixels inside circle are navy blue"""
    pixels = img.load()
    width, height = img.size
    
    center_x, center_y, radius = find_circle_center_and_radius(img)
    navy_blue = get_navy_blue_from_reference()
    vibrant_green = (34, 139, 34)
    
    converted_to_navy = 0
    already_green = 0
    already_navy = 0
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Skip transparent pixels
            if a == 0:
                continue
            
            # Only process pixels inside the circle
            if is_inside_circle(x, y, center_x, center_y, radius):
                # Keep green (continents)
                if (r, g, b) == vibrant_green:
                    already_green += 1
                # Keep navy blue (already water)
                elif (r, g, b) == navy_blue:
                    already_navy += 1
                # Everything else inside circle should be navy blue (water)
                else:
                    pixels[x, y] = (*navy_blue, a)
                    converted_to_navy += 1
    
    print(f"Already green (continents): {already_green}")
    print(f"Already navy (water): {already_navy}")
    print(f"Converted to navy blue (water): {converted_to_navy}")
    return img

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(script_dir)
    images_dir = os.path.join(web_dir, "public", "images")
    
    logo1_path = os.path.join(images_dir, "logo (1).png")
    
    print("Loading logo (1).png...")
    img = Image.open(logo1_path).convert("RGBA")
    print(f"  Size: {img.size}")
    
    print("Fixing water areas to be navy blue...")
    img = fix_water_areas(img)
    
    print(f"Saving updated logo (1).png...")
    img.save(logo1_path, "PNG")
    
    print("Done! All water areas inside the circle are now navy blue.")
