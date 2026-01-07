"""
Script to make white parts of logo transparent
Converts white and near-white pixels in logo.png to transparent
"""
from PIL import Image
import os

def is_white_pixel(r, g, b, threshold=50):
    """
    Check if a pixel is white or near-white
    threshold: how close to white (255, 255, 255) a pixel needs to be
    Also checks for very light gray/white colors
    """
    # Check if all RGB values are close to 255 (pure white)
    if r > (255 - threshold) and g > (255 - threshold) and b > (255 - threshold):
        return True
    
    # Also check for very light colors (high brightness, low saturation)
    # Calculate brightness
    brightness = (r + g + b) / 3
    # Calculate saturation (difference between max and min RGB)
    max_rgb = max(r, g, b)
    min_rgb = min(r, g, b)
    saturation = max_rgb - min_rgb if max_rgb > 0 else 0
    
    # If brightness is very high and saturation is low, it's likely white/light gray
    if brightness > (255 - threshold) and saturation < 30:
        return True
    
    return False

def make_white_transparent(image_path, output_path, threshold=50, brightness_threshold=240):
    """
    Convert white and near-white pixels to transparent
    threshold: tolerance for what counts as "white" (0-255, lower = stricter)
    brightness_threshold: minimum brightness to consider as white (0-255)
    """
    img = Image.open(image_path).convert("RGBA")
    pixels = img.load()
    
    width, height = img.size
    transparent_count = 0
    total_pixels = width * height
    
    # First pass: analyze the image to understand color distribution
    light_pixels = []
    sample_colors = set()
    for y in range(0, height, max(1, height // 20)):  # Sample every 20th row
        for x in range(0, width, max(1, width // 20)):  # Sample every 20th column
            r, g, b, a = pixels[x, y]
            if a > 0:  # Only check non-transparent pixels
                brightness = (r + g + b) / 3
                sample_colors.add((r, g, b))
                if brightness > 200:  # Very light pixels
                    light_pixels.append((r, g, b, brightness))
    
    print(f"   Sample colors found: {list(sample_colors)[:10]}")  # Show first 10 unique colors
    if light_pixels:
        avg_brightness = sum(p[3] for p in light_pixels) / len(light_pixels)
        print(f"   Found {len(light_pixels)} light pixels (avg brightness: {avg_brightness:.1f})")
    else:
        print(f"   No light pixels found (brightness > 200)")
        print(f"   Note: If logo has white background, try lowering brightness_threshold")
    
    # Second pass: make white/light pixels transparent
    # Use a more aggressive approach - make any very light pixel transparent
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Skip already transparent pixels
            if a == 0:
                continue
            
            # Calculate brightness
            brightness = (r + g + b) / 3
            
            # Make any very light pixel transparent
            # Check both brightness threshold and white detection
            if brightness > brightness_threshold or is_white_pixel(r, g, b, threshold):
                # Make it transparent
                pixels[x, y] = (r, g, b, 0)
                transparent_count += 1
    
    img.save(output_path, "PNG")
    print(f"Logo processed and saved to: {output_path}")
    print(f"   Made {transparent_count} white/light pixels transparent")
    print(f"   Total pixels: {total_pixels}, Transparent now: {transparent_count}")
    
    if transparent_count == 0:
        print(f"\n   TIP: If you want to make lighter colors transparent,")
        print(f"   try lowering brightness_threshold (currently {brightness_threshold})")
        print(f"   Example: brightness_threshold=200 will make more pixels transparent")

if __name__ == "__main__":
    # Get the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(script_dir)
    
    # Paths
    logo_path = os.path.join(web_dir, "public", "images", "logo.png")
    
    # Check if logo exists
    if not os.path.exists(logo_path):
        print(f"Logo not found at: {logo_path}")
        print("Please ensure logo.png exists in web/public/images/")
        exit(1)
    
    # Process logo
    print(f"Making white parts of logo transparent...")
    print(f"Processing: {logo_path}")
    # Use a more precise white detection - target pure white and very close whites
    # threshold=30 means pixels within 30 of 255 will be considered white
    # brightness_threshold=245 means any pixel with brightness > 245 will be transparent
    make_white_transparent(logo_path, logo_path, threshold=30, brightness_threshold=245)
    
    print("\nLogo processing complete!")
    print(f"   Updated: {logo_path}")
