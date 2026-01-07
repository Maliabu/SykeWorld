"""
Script to apply green and navy colors to logo
- Green color for certain parts
- Navy color where navy should be
"""
from PIL import Image
import os

def is_dark_color(r, g, b, threshold=100):
    """
    Check if a color is dark (could be navy/blue)
    """
    brightness = (r + g + b) / 3
    return brightness < threshold

def is_navy_area(r, g, b):
    """
    Determine if a pixel should be navy based on its color
    Navy areas are typically dark blue
    """
    # Check if it's a dark blue color (low red, low green, higher blue)
    if r < 80 and g < 80 and b > 50:
        return True
    # Also check for very dark colors (likely navy areas)
    brightness = (r + g + b) / 3
    if brightness < 80:
        return True
    return False

def is_colored_area(r, g, b):
    """
    Determine if a pixel is a colored area (not navy, should be green)
    Typically orange, light colors, or medium brightness colors
    """
    brightness = (r + g + b) / 3
    # If it's not very dark and not navy, it's likely a colored area
    if brightness > 80:
        # Check if it's not white/transparent
        if not (r > 240 and g > 240 and b > 240):
            return True
    return False

def apply_logo_colors(image_path, output_path):
    """
    Apply green and navy colors to logo
    - Navy (dark blue) for navy areas (typically outer edges, main structure)
    - Green for accent areas (typically inner details, highlights)
    Strategy: Use position-based or pattern-based detection to identify green vs navy areas
    """
    img = Image.open(image_path).convert("RGBA")
    pixels = img.load()
    
    width, height = img.size
    
    # Define colors
    navy = (0, 32, 96)  # Navy blue RGB - dark blue
    green = (34, 139, 34)  # Forest green RGB
    
    navy_count = 0
    green_count = 0
    transparent_count = 0
    
    # First, analyze the image to understand color distribution
    color_samples = []
    for y in range(0, height, max(1, height // 20)):
        for x in range(0, width, max(1, width // 20)):
            r, g, b, a = pixels[x, y]
            if a > 0:
                color_samples.append((r, g, b))
    
    print(f"   Sample colors found: {list(set(color_samples))[:10]}")
    
    # Strategy: Alternate or pattern-based coloring
    # Option 1: Make left/center areas green, edges navy
    # Option 2: Make every other pixel or region green
    # Option 3: Make inner details green, outer structure navy
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Skip transparent pixels
            if a == 0:
                transparent_count += 1
                continue
            
            # Calculate position relative to center
            center_x = width / 2
            center_y = height / 2
            dist_from_center = ((x - center_x) ** 2 + (y - center_y) ** 2) ** 0.5
            max_dist = ((width/2) ** 2 + (height/2) ** 2) ** 0.5
            
            # Strategy: Inner areas (closer to center) = green, outer areas = navy
            # Or use a checkerboard/alternating pattern
            # Let's use a combination: inner 40% = green, outer 60% = navy
            relative_dist = dist_from_center / max_dist if max_dist > 0 else 0
            
            # Also check if it's an edge pixel (likely navy for structure)
            is_edge = x < 5 or x > width - 5 or y < 5 or y > height - 5
            
            if is_edge or relative_dist > 0.4:
                # Outer areas and edges = navy
                pixels[x, y] = (navy[0], navy[1], navy[2], a)
                navy_count += 1
            else:
                # Inner areas = green
                pixels[x, y] = (green[0], green[1], green[2], a)
                green_count += 1
    
    img.save(output_path, "PNG")
    print(f"Logo processed and saved to: {output_path}")
    print(f"   Applied navy to {navy_count} pixels")
    print(f"   Applied green to {green_count} pixels")
    print(f"   Transparent pixels: {transparent_count}")

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
    print(f"Applying green and navy colors to logo...")
    print(f"Processing: {logo_path}")
    apply_logo_colors(logo_path, logo_path)
    
    print("\nLogo processing complete!")
    print(f"   Updated: {logo_path}")
