"""
Update logo (1).png:
1. Convert orange parts to green
2. Compare with logo.png to find navy blue areas
3. Apply navy blue to same areas in logo (1).png (better matching)
"""
from PIL import Image
import os

def is_orange_pixel(r, g, b, threshold=50):
    """Check if pixel is orange"""
    # Orange typically has high red, medium green, low blue
    if r > 150 and g > 50 and b < 150:
        # More specific: R should be highest
        if r > g and r > b and (r - g) > 30:
            return True
    return False

def is_navy_blue_pixel(r, g, b, threshold=50):
    """Check if pixel is navy blue"""
    # Navy blue: low red, low-medium green, medium-high blue
    if r < 100 and g < 100 and b > 50:
        # Blue should be dominant
        if b > r and b > g:
            return True
    return False

def convert_orange_to_green(img):
    """Convert orange pixels to green"""
    pixels = img.load()
    width, height = img.size
    vibrant_green = (34, 139, 34)  # Medium green
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

def get_navy_blue_color_from_reference(reference_img):
    """Extract the navy blue color from reference image"""
    pixels = reference_img.load()
    width, height = reference_img.size
    
    navy_colors = []
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 0 and is_navy_blue_pixel(r, g, b):
                navy_colors.append((r, g, b))
    
    if navy_colors:
        # Use the most common navy blue color
        from collections import Counter
        color_counts = Counter(navy_colors)
        navy_color = color_counts.most_common(1)[0][0]
        print(f"Found navy blue color in reference: {navy_color}")
        return navy_color
    
    # Default navy blue
    return (0, 32, 96)

def create_navy_blue_mask(reference_img):
    """Create a binary mask of navy blue areas"""
    pixels = reference_img.load()
    width, height = reference_img.size
    mask = [[False] * width for _ in range(height)]
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 0 and is_navy_blue_pixel(r, g, b):
                mask[y][x] = True
    
    return mask

def apply_navy_blue_areas(target_img, reference_img, navy_color):
    """Apply navy blue to target image based on reference structure"""
    target_pixels = target_img.load()
    target_width, target_height = target_img.size
    ref_width, ref_height = reference_img.size
    
    # Create mask from reference
    ref_mask = create_navy_blue_mask(reference_img)
    
    applied = 0
    
    # Scale and apply navy blue
    scale_x = target_width / ref_width
    scale_y = target_height / ref_height
    
    for ref_y in range(ref_height):
        for ref_x in range(ref_width):
            if ref_mask[ref_y][ref_x]:
                # Map to target coordinates
                target_x_start = int(ref_x * scale_x)
                target_x_end = int((ref_x + 1) * scale_x)
                target_y_start = int(ref_y * scale_y)
                target_y_end = int((ref_y + 1) * scale_y)
                
                # Apply navy blue to this region in target
                for ty in range(target_y_start, min(target_y_end, target_height)):
                    for tx in range(target_x_start, min(target_x_end, target_width)):
                        r, g, b, a = target_pixels[tx, ty]
                        if a > 0:  # Only apply to non-transparent pixels
                            target_pixels[tx, ty] = (*navy_color, a)
                            applied += 1
    
    print(f"Applied navy blue to {applied} pixels in target image")
    return target_img

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(script_dir)
    images_dir = os.path.join(web_dir, "public", "images")
    
    logo1_path = os.path.join(images_dir, "logo (1).png")
    logo_ref_path = os.path.join(images_dir, "logo.png")
    output_path = os.path.join(images_dir, "logo (1).png")
    
    if not os.path.exists(logo1_path):
        print(f"logo (1).png not found at: {logo1_path}")
        exit(1)
    
    if not os.path.exists(logo_ref_path):
        print(f"logo.png not found at: {logo_ref_path}")
        exit(1)
    
    print("Step 1: Loading logo (1).png...")
    logo1 = Image.open(logo1_path).convert("RGBA")
    print(f"  Size: {logo1.size}")
    
    print("Step 2: Converting orange to green...")
    logo1 = convert_orange_to_green(logo1)
    
    print("Step 3: Loading logo.png as reference...")
    logo_ref = Image.open(logo_ref_path).convert("RGBA")
    print(f"  Size: {logo_ref.size}")
    
    print("Step 4: Extracting navy blue color from logo.png...")
    navy_color = get_navy_blue_color_from_reference(logo_ref)
    
    print("Step 5: Applying navy blue areas to logo (1).png...")
    logo1 = apply_navy_blue_areas(logo1, logo_ref, navy_color)
    
    print(f"Step 6: Saving updated logo (1).png...")
    logo1.save(output_path, "PNG")
    
    print(f"Done! Updated logo saved to: {output_path}")
