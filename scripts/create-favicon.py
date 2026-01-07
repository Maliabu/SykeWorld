"""
Create favicon.ico from logo.png
"""
from PIL import Image
import os

def create_favicon_from_logo():
    """Create favicon.ico from logo.png"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(script_dir)
    
    logo_path = os.path.join(web_dir, "public", "images", "logo.png")
    favicon_path = os.path.join(web_dir, "app", "favicon.ico")
    
    if not os.path.exists(logo_path):
        print(f"logo.png not found at: {logo_path}")
        exit(1)
    
    print(f"Loading logo from: {logo_path}")
    logo_img = Image.open(logo_path).convert("RGBA")
    print(f"  Original size: {logo_img.size}")
    
    # Create multiple sizes for favicon (ICO format supports multiple sizes)
    sizes = [(16, 16), (32, 32), (48, 48)]
    favicon_images = []
    
    for size in sizes:
        # Resize with high-quality resampling
        resized = logo_img.resize(size, Image.Resampling.LANCZOS)
        favicon_images.append(resized)
        print(f"  Created {size[0]}x{size[1]} icon")
    
    # Save as ICO file with multiple sizes
    # Note: PIL doesn't directly support ICO with multiple sizes, so we'll save the largest
    # For better compatibility, we'll also create a single 32x32 ICO
    favicon_images[1].save(favicon_path, format="ICO", sizes=[(32, 32)])
    print(f"\nFavicon saved to: {favicon_path}")
    
    # Also create a 16x16 version for better browser compatibility
    favicon_16_path = os.path.join(web_dir, "app", "icon.png")
    favicon_images[0].save(favicon_16_path, format="PNG")
    print(f"Also created icon.png (16x16) at: {favicon_16_path}")
    
    print("\nDone! Favicon has been updated to use logo.png")

if __name__ == "__main__":
    create_favicon_from_logo()
