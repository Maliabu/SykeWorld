"""
Fix logo: Make ALL white pixels transparent, including borders
"""
from PIL import Image
import os

def make_all_white_transparent(image_path, output_path, threshold=10):
    """
    Convert ALL white and near-white pixels to transparent
    """
    img = Image.open(image_path).convert("RGBA")
    pixels = img.load()
    
    width, height = img.size
    transparent_count = 0
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Skip already transparent pixels
            if a == 0:
                continue
            
            # Check if pixel is white or very close to white
            # All RGB values must be within threshold of 255
            if (r >= 255 - threshold and 
                g >= 255 - threshold and 
                b >= 255 - threshold):
                # Make it transparent
                pixels[x, y] = (r, g, b, 0)
                transparent_count += 1
    
    img.save(output_path, "PNG")
    print(f"Made {transparent_count} white pixels transparent")
    return img

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(script_dir)
    logo_path = os.path.join(web_dir, "public", "images", "logo.png")
    
    if not os.path.exists(logo_path):
        print(f"Logo not found at: {logo_path}")
        exit(1)
    
    print(f"Making ALL white parts transparent in: {logo_path}")
    make_all_white_transparent(logo_path, logo_path, threshold=10)
    print("Done!")
