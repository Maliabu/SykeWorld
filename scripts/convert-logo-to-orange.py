"""
Script to convert orange colors in logo to Tailwind orange-400
Converts any orange shades in logo.png to orange-400 (#fb923c)
"""
from PIL import Image
import os
import math

def is_orange_pixel(r, g, b, threshold=30):
    """
    Check if a pixel is orange (red is high, green is medium, blue is low)
    """
    # Orange colors typically have: high red, medium green, low blue
    # Check if red is dominant and green is moderate
    if r > 150 and g > 50 and b < r and (r - b) > 50:
        # Calculate hue to verify it's in orange range (15-45 degrees)
        # Simplified check: red > green > blue with significant difference
        return True
    return False

def convert_orange_to_orange400(image_path, output_path):
    """
    Convert orange colors to Tailwind orange-400 (#fb923c = RGB(251, 146, 60))
    """
    img = Image.open(image_path).convert("RGBA")
    pixels = img.load()
    
    width, height = img.size
    orange_400 = (251, 146, 60)  # Tailwind orange-400
    
    converted_count = 0
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Skip transparent pixels
            if a == 0:
                continue
            
            # Check if pixel is orange (any shade)
            if is_orange_pixel(r, g, b):
                # Convert to orange-400
                pixels[x, y] = (orange_400[0], orange_400[1], orange_400[2], a)
                converted_count += 1
    
    img.save(output_path, "PNG")
    print(f"Logo converted and saved to: {output_path}")
    print(f"   Converted {converted_count} orange pixels to orange-400")

if __name__ == "__main__":
    # Get the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(script_dir)
    
    # Paths
    logo_path = os.path.join(web_dir, "public", "images", "logo.png")
    favicon_path = os.path.join(web_dir, "app", "favicon.ico")
    
    # Check if logo exists
    if not os.path.exists(logo_path):
        print(f"Logo not found at: {logo_path}")
        print("Please ensure logo.png exists in web/public/images/")
        exit(1)
    
    # Convert logo
    print(f"Converting orange colors in logo to orange-400 (#fb923c)...")
    convert_orange_to_orange400(logo_path, logo_path)
    
    # Also create favicon from logo
    print(f"Creating favicon from logo...")
    img = Image.open(logo_path)
    
    # Resize to 32x32 for favicon (standard size)
    favicon_size = (32, 32)
    favicon_img = img.resize(favicon_size, Image.Resampling.LANCZOS)
    
    # Convert to ICO format and save
    favicon_img.save(favicon_path, format="ICO", sizes=[(32, 32)])
    print(f"Favicon created at: {favicon_path}")
    
    print("\nLogo conversion complete!")
    print("Files updated:")
    print(f"   - {logo_path}")
    print(f"   - {favicon_path}")



