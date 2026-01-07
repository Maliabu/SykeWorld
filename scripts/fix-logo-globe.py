"""
Fix logo (1).png:
1. Find the perfect circle (globe)
2. Convert orange parts inside circle to green (continents)
3. Convert rest of circle to navy blue (oceans)
4. Leave everything outside circle unchanged
"""
from PIL import Image
import math
import os

def find_circle_center_and_radius(img):
    """Find the center and radius of the circle in the image"""
    pixels = img.load()
    width, height = img.size
    
    # Find bounding box of non-transparent pixels
    min_x, min_y = width, height
    max_x, max_y = 0, 0
    
    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] > 0:  # Non-transparent
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    
    # Circle center is center of bounding box
    center_x = (min_x + max_x) // 2
    center_y = (min_y + max_y) // 2
    
    # Radius is half the smaller dimension (for a perfect circle)
    radius = min((max_x - min_x) // 2, (max_y - min_y) // 2)
    
    print(f"Found circle: center=({center_x}, {center_y}), radius={radius}")
    return center_x, center_y, radius

def is_inside_circle(x, y, center_x, center_y, radius):
    """Check if point is inside the circle"""
    dx = x - center_x
    dy = y - center_y
    distance = math.sqrt(dx*dx + dy*dy)
    return distance <= radius

def is_orange_pixel(r, g, b, threshold=50):
    """Check if pixel is orange"""
    # Orange: high red, medium green, low blue
    if r > 150 and g > 50 and b < 150:
        # Red should be highest
        if r > g and r > b and (r - g) > 30:
            return True
    # Check for specific orange shades
    if r > 200 and 100 <= g <= 200 and b < 100:
        return True
    return False

def get_navy_blue_from_reference():
    """Get navy blue color from logo.png"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(script_dir)
    logo_ref_path = os.path.join(web_dir, "public", "images", "logo.png")
    
    if os.path.exists(logo_ref_path):
        ref_img = Image.open(logo_ref_path).convert("RGBA")
        ref_pixels = ref_img.load()
        
        # Find navy blue color
        navy_colors = []
        for y in range(ref_img.size[1]):
            for x in range(ref_img.size[0]):
                r, g, b, a = ref_pixels[x, y]
                if a > 0:
                    # Navy blue: low red, low green, medium-high blue
                    if r < 100 and g < 100 and b > 50 and b > r and b > g:
                        navy_colors.append((r, g, b))
        
        if navy_colors:
            from collections import Counter
            color_counts = Counter(navy_colors)
            navy_color = color_counts.most_common(1)[0][0]
            print(f"Extracted navy blue from logo.png: {navy_color}")
            return navy_color
    
    # Default navy blue
    return (0, 32, 96)

def fix_globe_colors(img):
    """Fix colors inside the globe circle"""
    pixels = img.load()
    width, height = img.size
    
    # Find the circle
    center_x, center_y, radius = find_circle_center_and_radius(img)
    
    # Get navy blue color
    navy_blue = get_navy_blue_from_reference()
    vibrant_green = (34, 139, 34)  # Green for continents
    
    orange_to_green = 0
    other_to_navy = 0
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Skip transparent pixels
            if a == 0:
                continue
            
            # Only process pixels inside the circle
            if is_inside_circle(x, y, center_x, center_y, radius):
                # Check if it's orange (continent) - convert to green
                if is_orange_pixel(r, g, b):
                    pixels[x, y] = (*vibrant_green, a)
                    orange_to_green += 1
                # Check if it's already green - leave it
                elif r == 34 and g == 139 and b == 34:
                    # Already green, keep it
                    pass
                # Everything else inside circle should be navy blue (ocean)
                else:
                    pixels[x, y] = (*navy_blue, a)
                    other_to_navy += 1
    
    print(f"Converted {orange_to_green} orange pixels to green (continents)")
    print(f"Converted {other_to_navy} other pixels to navy blue (oceans)")
    return img

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(script_dir)
    images_dir = os.path.join(web_dir, "public", "images")
    
    logo1_path = os.path.join(images_dir, "logo (1).png")
    output_path = logo1_path
    
    if not os.path.exists(logo1_path):
        print(f"logo (1).png not found at: {logo1_path}")
        exit(1)
    
    print("Loading logo (1).png...")
    img = Image.open(logo1_path).convert("RGBA")
    print(f"  Size: {img.size}")
    
    print("Fixing globe colors...")
    img = fix_globe_colors(img)
    
    print(f"Saving updated logo (1).png...")
    img.save(output_path, "PNG")
    
    print("Done!")
