"""
Analyze and fix logo (1).png properly
"""
from PIL import Image
import math
import os

def analyze_and_fix(image_path, output_path):
    """Analyze the logo and fix it"""
    img = Image.open(image_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    vibrant_green = (34, 139, 34)  # Green for continents
    navy_blue = (0, 32, 96)  # Navy blue for ocean
    
    # Find circle
    center_x, center_y = width // 2, height // 2
    radius = min(width, height) // 2 - 10
    
    print(f"Circle: center=({center_x}, {center_y}), radius={radius}")
    
    # Analyze what's inside the circle
    total_inside = 0
    green_count = 0
    navy_count = 0
    orange_count = 0
    other_colors = {}
    
    for y in range(height):
        for x in range(width):
            distance = math.sqrt((x - center_x)**2 + (y - center_y)**2)
            if distance <= radius:
                total_inside += 1
                r, g, b, a = pixels[x, y]
                
                if a == 0:
                    continue
                
                # Check if green
                if abs(r - vibrant_green[0]) < 30 and abs(g - vibrant_green[1]) < 30 and abs(b - vibrant_green[2]) < 30:
                    green_count += 1
                # Check if navy
                elif r < 50 and g < 50 and b > 80:
                    navy_count += 1
                # Check if orange
                elif r > 150 and g > 50 and b < 150 and r > g:
                    orange_count += 1
                else:
                    color_key = (r, g, b)
                    other_colors[color_key] = other_colors.get(color_key, 0) + 1
    
    print(f"\nAnalysis inside circle:")
    print(f"  Total pixels: {total_inside}")
    print(f"  Green (continents): {green_count}")
    print(f"  Navy (ocean): {navy_count}")
    print(f"  Orange: {orange_count}")
    print(f"  Other colors: {len(other_colors)}")
    if other_colors:
        print(f"  Top other colors: {sorted(other_colors.items(), key=lambda x: x[1], reverse=True)[:5]}")
    
    # Now fix it
    print(f"\nFixing logo...")
    
    orange_to_green = 0
    other_to_navy = 0
    
    for y in range(height):
        for x in range(width):
            distance = math.sqrt((x - center_x)**2 + (y - center_y)**2)
            if distance <= radius:  # Inside circle
                r, g, b, a = pixels[x, y]
                
                if a == 0:
                    continue
                
                # Check if green - keep it (continents)
                is_green = (abs(r - vibrant_green[0]) < 30 and 
                           abs(g - vibrant_green[1]) < 30 and 
                           abs(b - vibrant_green[2]) < 30)
                
                if is_green:
                    pass  # Already green (continents), keep it
                # Check if orange - convert to green (continents)
                elif r > 150 and g > 50 and b < 150 and r > g and (r - g) > 30:
                    pixels[x, y] = (*vibrant_green, a)
                    orange_to_green += 1
                # Everything else inside circle should be navy blue (ocean)
                else:
                    pixels[x, y] = (*navy_blue, a)
                    other_to_navy += 1
    
    print(f"  Converted {orange_to_green} orange to green (continents)")
    print(f"  Made {other_to_navy} pixels navy blue (ocean)")
    
    img.save(output_path, "PNG")
    print(f"\nSaved to: {output_path}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(script_dir)
    images_dir = os.path.join(web_dir, "public", "images")
    
    logo1_path = os.path.join(images_dir, "logo (1).png")
    output_path = os.path.join(images_dir, "logo (1).png")
    
    analyze_and_fix(logo1_path, output_path)
    print("Done!")
