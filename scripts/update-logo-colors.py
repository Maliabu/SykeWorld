"""
Update logo (1).png:
1. Convert orange parts to green
2. Compare with logo.png to find navy blue areas
3. Apply navy blue to same areas in logo (1).png
"""
from PIL import Image
import os

def is_orange_pixel(r, g, b, threshold=30):
    """Check if pixel is orange (high red, medium green, low blue)"""
    # Orange typically has: R > 200, G between 100-200, B < 100
    if r > 200 and 100 <= g <= 200 and b < 100:
        return True
    # Also check for orange-500 (#F97316 = rgb(249, 115, 22))
    if abs(r - 249) < threshold and abs(g - 115) < threshold and abs(b - 22) < threshold:
        return True
    return False

def is_navy_blue_pixel(r, g, b, threshold=30):
    """Check if pixel is navy blue (low red, low green, medium-high blue)"""
    # Navy blue typically: R < 50, G < 50, B > 100
    if r < 50 and g < 50 and b > 100:
        return True
    # Also check for dark blue (0, 32, 96) or deep blue (0, 0, 139)
    if abs(r - 0) < threshold and abs(g - 32) < threshold and abs(b - 96) < threshold:
        return True
    if abs(r - 0) < threshold and abs(g - 0) < threshold and abs(b - 139) < threshold:
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

def find_navy_blue_mask(reference_img):
    """Create a mask of navy blue areas in reference image"""
    pixels = reference_img.load()
    width, height = reference_img.size
    mask = {}
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Skip transparent pixels
            if a == 0:
                continue
            
            # If navy blue, mark this position
            if is_navy_blue_pixel(r, g, b):
                # Normalize coordinates to 0-1 range for scaling
                norm_x = x / width
                norm_y = y / height
                mask[(norm_x, norm_y)] = (r, g, b)
    
    print(f"Found {len(mask)} navy blue pixel positions in reference")
    return mask

def apply_navy_blue_from_mask(target_img, navy_blue_mask, reference_img):
    """Apply navy blue to target image based on reference mask"""
    target_pixels = target_img.load()
    target_width, target_height = target_img.size
    ref_width, ref_height = reference_img.size
    
    applied = 0
    
    # Get the actual navy blue color from reference
    ref_pixels = reference_img.load()
    navy_color = None
    for y in range(ref_height):
        for x in range(ref_width):
            r, g, b, a = ref_pixels[x, y]
            if a > 0 and is_navy_blue_pixel(r, g, b):
                navy_color = (r, g, b)
                break
        if navy_color:
            break
    
    if not navy_color:
        # Default navy blue
        navy_color = (0, 32, 96)
    
    print(f"Using navy blue color: {navy_color}")
    
    # Apply navy blue to corresponding areas in target
    for norm_x, norm_y in navy_blue_mask:
        # Scale coordinates to target image size
        target_x = int(norm_x * target_width)
        target_y = int(norm_y * target_height)
        
        # Make sure coordinates are within bounds
        if 0 <= target_x < target_width and 0 <= target_y < target_height:
            r, g, b, a = target_pixels[target_x, target_y]
            
            # Only apply if pixel is not transparent
            if a > 0:
                target_pixels[target_x, target_y] = (*navy_color, a)
                applied += 1
    
    print(f"Applied navy blue to {applied} pixels")
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
    
    print("Step 2: Converting orange to green...")
    logo1 = convert_orange_to_green(logo1)
    
    print("Step 3: Loading logo.png as reference...")
    logo_ref = Image.open(logo_ref_path).convert("RGBA")
    
    print("Step 4: Finding navy blue areas in logo.png...")
    navy_mask = find_navy_blue_mask(logo_ref)
    
    print("Step 5: Applying navy blue to logo (1).png...")
    logo1 = apply_navy_blue_from_mask(logo1, navy_mask, logo_ref)
    
    print(f"Step 6: Saving updated logo (1).png...")
    logo1.save(output_path, "PNG")
    
    print(f"Done! Updated logo saved to: {output_path}")
