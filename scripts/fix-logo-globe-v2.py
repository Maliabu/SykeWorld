"""
Fix logo (1).png properly:
1. Convert orange parts to green (continents)
2. Find the perfect circle (globe)
3. Make ALL ocean/water areas inside the circle navy blue (everything that's not green continents)
"""
from PIL import Image
import math
import os

def is_orange_pixel(r, g, b, threshold=50):
    """Check if pixel is orange"""
    # Orange: high red, medium green, low blue
    if r > 150 and g > 50 and g < 200 and b < 150:
        if r > g and r > b and (r - g) > 30:
            return True
    # Check for orange-500 (#F97316 = rgb(249, 115, 22))
    if abs(r - 249) < threshold and abs(g - 115) < threshold and abs(b - 22) < threshold:
        return True
    # Also check for lighter orange (251, 146, 60) seen in the image
    if abs(r - 251) < threshold and abs(g - 146) < threshold and abs(b - 60) < threshold:
        return True
    return False

def is_green_continent(r, g, b, threshold=30):
    """Check if pixel is green (continent)"""
    vibrant_green = (34, 139, 34)
    if abs(r - vibrant_green[0]) < threshold and abs(g - vibrant_green[1]) < threshold and abs(b - vibrant_green[2]) < threshold:
        return True
    return False

def find_circle_center_and_radius(img):
    """Find the center and radius of the perfect circle in the image"""
    pixels = img.load()
    width, height = img.size
    
    # Find the bounding box of non-transparent pixels
    min_x, min_y = width, height
    max_x, max_y = 0, 0
    
    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] > 0:  # Non-transparent
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    
    # Circle center should be in the middle of the bounding box
    center_x = (min_x + max_x) // 2
    center_y = (min_y + max_y) // 2
    
    # Radius is half the smaller dimension
    radius = min((max_x - min_x) // 2, (max_y - min_y) // 2)
    
    print(f"Found circle: center=({center_x}, {center_y}), radius={radius}")
    return center_x, center_y, radius

def is_inside_circle(x, y, center_x, center_y, radius):
    """Check if point is inside the circle"""
    distance = math.sqrt((x - center_x)**2 + (y - center_y)**2)
    return distance <= radius

def update_logo_globe(image_path, output_path):
    """Update logo: orange to green, ocean to navy blue"""
    img = Image.open(image_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    vibrant_green = (34, 139, 34)  # Green for continents
    navy_blue = (0, 32, 96)  # Navy blue for ocean
    
    print("Step 1: Finding the circle (globe)...")
    center_x, center_y, radius = find_circle_center_and_radius(img)
    
    print("Step 2: Converting orange to green (continents)...")
    orange_to_green = 0
    
    # First pass: convert orange to green (continents)
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Skip transparent pixels
            if a == 0:
                continue
            
            # Check if inside circle
            inside_circle = is_inside_circle(x, y, center_x, center_y, radius)
            
            if inside_circle:
                # Inside circle: convert orange to green (continents)
                if is_orange_pixel(r, g, b):
                    pixels[x, y] = (*vibrant_green, a)
                    orange_to_green += 1
    
    print(f"  Converted {orange_to_green} orange pixels to green (continents)")
    
    print("Step 3: Making ALL ocean areas navy blue (everything inside circle that's not green)...")
    ocean_to_navy = 0
    
    # Second pass: make ALL ocean areas navy blue
    # Ocean = inside circle AND NOT green (continents)
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Skip transparent pixels
            if a == 0:
                continue
            
            # Check if inside circle
            inside_circle = is_inside_circle(x, y, center_x, center_y, radius)
            
            if inside_circle:
                # Check if this is NOT a green continent
                is_green = is_green_continent(r, g, b)
                
                # If it's not green (continent), make it navy blue (ocean)
                if not is_green:
                    pixels[x, y] = (*navy_blue, a)
                    ocean_to_navy += 1
    
    print(f"  Made {ocean_to_navy} pixels navy blue (ocean)")
    
    img.save(output_path, "PNG")
    print(f"Saved to: {output_path}")
    return img

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(script_dir)
    images_dir = os.path.join(web_dir, "public", "images")
    
    logo1_path = os.path.join(images_dir, "logo (1).png")
    output_path = os.path.join(images_dir, "logo (1).png")
    
    if not os.path.exists(logo1_path):
        print(f"logo (1).png not found at: {logo1_path}")
        exit(1)
    
    print(f"Processing: {logo1_path}")
    update_logo_globe(logo1_path, output_path)
    print("Done!")
