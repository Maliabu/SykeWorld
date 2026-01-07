"""
Fix orange arches outside the circle - convert them to green
"""
from PIL import Image
import math
import os

def fix_orange_arches(image_path, output_path):
    """Convert orange arches outside the circle to green"""
    img = Image.open(image_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    vibrant_green = (34, 139, 34)  # Green
    navy_blue = (0, 32, 96)  # Navy blue for ocean
    
    # Circle parameters
    center_x, center_y = width // 2, height // 2
    radius = min(width, height) // 2 - 10
    
    print(f"Circle: center=({center_x}, {center_y}), radius={radius}")
    
    orange_to_green = 0
    other_to_navy = 0
    green_kept = 0
    
    for y in range(height):
        for x in range(width):
            distance = math.sqrt((x - center_x)**2 + (y - center_y)**2)
            r, g, b, a = pixels[x, y]
            
            if a == 0:
                continue
            
            if distance <= radius:
                # Inside circle - handle as before
                # Check if already green (continents) - keep it
                is_green = (abs(r - vibrant_green[0]) < 30 and 
                           abs(g - vibrant_green[1]) < 30 and 
                           abs(b - vibrant_green[2]) < 30)
                
                if is_green:
                    green_kept += 1
                    continue
                
                # Check if orange - convert to green (continents)
                is_orange = (r > 150 and g > 50 and b < 150 and r > g and (r - g) > 30)
                
                if is_orange:
                    pixels[x, y] = (*vibrant_green, 255)
                    orange_to_green += 1
                else:
                    # Everything else inside circle = ocean (navy blue)
                    pixels[x, y] = (*navy_blue, 255)
                    other_to_navy += 1
            else:
                # Outside circle - convert orange arches to green
                is_orange = (r > 150 and g > 50 and b < 150 and r > g and (r - g) > 30)
                
                if is_orange:
                    pixels[x, y] = (*vibrant_green, a)
                    orange_to_green += 1
    
    print(f"Results:")
    print(f"  Orange to Green (inside + outside): {orange_to_green}")
    print(f"  Other to Navy (ocean): {other_to_navy}")
    print(f"  Green kept (continents): {green_kept}")
    
    img.save(output_path, "PNG")
    print(f"\nSaved to: {output_path}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(script_dir)
    images_dir = os.path.join(web_dir, "public", "images")
    
    logo1_path = os.path.join(images_dir, "logo (1).png")
    output_path = os.path.join(images_dir, "logo (1).png")
    
    print(f"Processing: {logo1_path}\n")
    fix_orange_arches(logo1_path, output_path)
    print("\nDone!")
