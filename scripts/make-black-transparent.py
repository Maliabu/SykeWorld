"""
Script to make black colors transparent in logo and favicon
Converts black pixels to transparent while keeping orange pixels
"""
from PIL import Image
import os

def make_black_transparent(image_path, output_path, black_threshold=50):
    """
    Convert black colors to transparent in the image
    Black RGB threshold: pixels with R, G, B all below threshold become transparent
    """
    img = Image.open(image_path).convert("RGBA")
    pixels = img.load()
    
    width, height = img.size
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Check if pixel is black or very dark (all RGB values below threshold)
            if r < black_threshold and g < black_threshold and b < black_threshold:
                # Make transparent by setting alpha to 0
                pixels[x, y] = (r, g, b, 0)
            # Keep all other pixels (orange, white, etc.) as they are
            else:
                pixels[x, y] = (r, g, b, a)
    
    img.save(output_path, "PNG")
    print(f"Image processed and saved to: {output_path}")

def create_favicon_from_logo(logo_path, favicon_path):
    """
    Create favicon.ico from the processed logo
    """
    img = Image.open(logo_path)
    
    # Resize to multiple sizes for favicon (standard sizes)
    favicon_sizes = [(16, 16), (32, 32), (48, 48)]
    
    # Create ICO file with multiple sizes
    favicon_img = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    resized = img.resize((48, 48), Image.Resampling.LANCZOS)
    favicon_img.paste(resized, (0, 0), resized)
    
    # Save as ICO format
    favicon_img.save(favicon_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"Favicon created at: {favicon_path}")

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
    
    # Process logo - make black transparent
    print("Making black transparent in logo...")
    make_black_transparent(logo_path, logo_path)
    
    # Create favicon from processed logo
    print("Creating favicon from processed logo...")
    create_favicon_from_logo(logo_path, favicon_path)
    
    print("\nLogo and favicon processing complete!")
    print("Files updated:")
    print(f"   - {logo_path} (black -> transparent)")
    print(f"   - {favicon_path} (created from processed logo)")
