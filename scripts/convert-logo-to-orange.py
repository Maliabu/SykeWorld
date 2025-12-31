"""
Script to convert green colors in logo to orange
Converts the logo.png from green/black to orange/black
"""
from PIL import Image
import os

def convert_green_to_orange(image_path, output_path):
    """
    Convert green colors to orange in the image
    Green RGB ranges: (0, 100-255, 0-150) -> Orange RGB: (249, 115, 22)
    """
    img = Image.open(image_path).convert("RGBA")
    pixels = img.load()
    
    width, height = img.size
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Check if pixel is green (green channel is high, red and blue are low)
            # Adjust threshold based on your logo's green shade
            if g > 100 and r < 150 and b < 150:
                # Convert to orange: RGB(249, 115, 22) - Tailwind orange-500
                pixels[x, y] = (249, 115, 22, a)
            # Keep black pixels as is (low RGB values)
            elif r < 50 and g < 50 and b < 50:
                pixels[x, y] = (r, g, b, a)
            # Keep dark grey (ocean) as is
            elif r < 100 and g < 100 and b < 100:
                pixels[x, y] = (r, g, b, a)
    
    img.save(output_path, "PNG")
    print(f"✅ Logo converted and saved to: {output_path}")

if __name__ == "__main__":
    # Get the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(script_dir)
    
    # Paths
    logo_path = os.path.join(web_dir, "public", "images", "logo.png")
    favicon_path = os.path.join(web_dir, "app", "favicon.ico")
    
    # Check if logo exists
    if not os.path.exists(logo_path):
        print(f"❌ Logo not found at: {logo_path}")
        print("Please ensure logo.png exists in web/public/images/")
        exit(1)
    
    # Convert logo
    print(f"🔄 Converting logo from green to orange...")
    convert_green_to_orange(logo_path, logo_path)
    
    # Also create favicon from logo
    print(f"🔄 Creating favicon from logo...")
    img = Image.open(logo_path)
    
    # Resize to 32x32 for favicon (standard size)
    favicon_size = (32, 32)
    favicon_img = img.resize(favicon_size, Image.Resampling.LANCZOS)
    
    # Convert to ICO format and save
    favicon_img.save(favicon_path, format="ICO", sizes=[(32, 32)])
    print(f"✅ Favicon created at: {favicon_path}")
    
    print("\n✅ Logo conversion complete!")
    print("📝 Files updated:")
    print(f"   - {logo_path}")
    print(f"   - {favicon_path}")



