"""
Convert orange parts to green in logo (1).png
"""
from PIL import Image
import os

def is_orange_pixel(r, g, b):
    """Check if pixel is orange"""
    # Orange: high red, medium green, low blue
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

def convert_orange_to_green(img):
    """Convert all orange pixels to green"""
    pixels = img.load()
    width, height = img.size
    vibrant_green = (34, 139, 34)  # Green
    converted = 0
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Skip transparent pixels
            if a == 0:
                continue
            
            # If orange, convert to green
            if is_orange_pixel(r, g, b):
                pixels[x, y] = (*vibrant_green, a)
                converted += 1
    
    print(f"Converted {converted} orange pixels to green")
    return img

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(script_dir)
    images_dir = os.path.join(web_dir, "public", "images")
    
    logo1_path = os.path.join(images_dir, "logo (1).png")
    
    if not os.path.exists(logo1_path):
        print(f"logo (1).png not found at: {logo1_path}")
        exit(1)
    
    print("Loading logo (1).png...")
    img = Image.open(logo1_path).convert("RGBA")
    print(f"  Size: {img.size}")
    
    print("Converting orange to green...")
    img = convert_orange_to_green(img)
    
    print(f"Saving updated logo (1).png...")
    img.save(logo1_path, "PNG")
    
    print("Done!")
