"""
Final fix for logo (1).png:
- Convert orange to green (continents)
- Make ALL non-green areas inside circle navy blue (ocean)
"""
from PIL import Image
import math
import os

def fix_logo_final(image_path, output_path):
    """Fix the logo properly"""
    img = Image.open(image_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    vibrant_green = (34, 139, 34)  # Green for continents
    navy_blue = (0, 32, 96)  # Navy blue for ocean
    
    # Find circle - use center of image
    center_x, center_y = width // 2, height // 2
    radius = min(width, height) // 2 - 10
    
    print(f"Circle: center=({center_x}, {center_y}), radius={radius}")
    
    orange_to_green = 0
    other_to_navy = 0
    green_kept = 0
    
    for y in range(height):
        for x in range(width):
            distance = math.sqrt((x - center_x)**2 + (y - center_y)**2)
            
            # Only process pixels inside the circle
            if distance <= radius:
                r, g, b, a = pixels[x, y]
                
                # Check if already green (continents) - keep it
                is_green = (a > 0 and 
                           abs(r - vibrant_green[0]) < 30 and 
                           abs(g - vibrant_green[1]) < 30 and 
                           abs(b - vibrant_green[2]) < 30)
                
                if is_green:
                    green_kept += 1
                    continue  # Keep green as is
                
                # Check if orange - convert to green (continents)
                is_orange = (a > 0 and r > 150 and g > 50 and b < 150 and r > g and (r - g) > 30)
                
                if is_orange:
                    pixels[x, y] = (*vibrant_green, 255)  # Make sure it's opaque
                    orange_to_green += 1
                else:
                    # Everything else inside circle (including transparent) = ocean (navy blue)
                    pixels[x, y] = (*navy_blue, 255)  # Make it opaque navy blue
                    other_to_navy += 1
    
    print(f"Results:")
    print(f"  Orange to Green (continents): {orange_to_green}")
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
    fix_logo_final(logo1_path, output_path)
    print("\nDone!")
