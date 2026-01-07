"""
Create logo version 2: White background, green continents, blue oceans, green curved lines
Then make white transparent
"""
from PIL import Image, ImageDraw
import math
import os

def create_logo_v2():
    """Create the logo with white background, green continents, blue oceans, green lines"""
    # Create image with white background
    width, height = 800, 600
    img = Image.new('RGBA', (width, height), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = width // 2, height // 2
    
    # Globe dimensions (vertical oval)
    globe_width = 200
    globe_height = 280
    globe_center_x = center_x
    globe_center_y = center_y
    
    # Draw outer blue border (dark blue)
    dark_blue = (0, 32, 96)
    draw.ellipse([
        globe_center_x - globe_width // 2 - 5,
        globe_center_y - globe_height // 2 - 5,
        globe_center_x + globe_width // 2 + 5,
        globe_center_y + globe_height // 2 + 5
    ], outline=dark_blue, width=4)
    
    # Draw inner white border
    draw.ellipse([
        globe_center_x - globe_width // 2 - 2,
        globe_center_y - globe_height // 2 - 2,
        globe_center_x + globe_width // 2 + 2,
        globe_center_y + globe_height // 2 + 2
    ], outline=(255, 255, 255, 255), width=3)
    
    # Draw blue ocean (deep blue circle)
    deep_blue = (0, 0, 139)  # Dark blue for oceans
    draw.ellipse([
        globe_center_x - globe_width // 2,
        globe_center_y - globe_height // 2,
        globe_center_x + globe_width // 2,
        globe_center_y + globe_height // 2
    ], fill=deep_blue)
    
    # Draw green continents (simplified shapes)
    vibrant_green = (34, 139, 34)  # Medium green
    
    # Africa (centered, prominent)
    africa_points = [
        (globe_center_x - 30, globe_center_y + 60),
        (globe_center_x - 20, globe_center_y + 80),
        (globe_center_x - 15, globe_center_y + 100),
        (globe_center_x - 10, globe_center_y + 110),
        (globe_center_x + 10, globe_center_y + 110),
        (globe_center_x + 20, globe_center_y + 100),
        (globe_center_x + 25, globe_center_y + 80),
        (globe_center_x + 20, globe_center_y + 60),
        (globe_center_x + 15, globe_center_y + 50),
        (globe_center_x - 10, globe_center_y + 50),
    ]
    draw.polygon(africa_points, fill=vibrant_green)
    
    # Europe (above Africa)
    europe_points = [
        (globe_center_x - 25, globe_center_y - 40),
        (globe_center_x - 20, globe_center_y - 60),
        (globe_center_x - 10, globe_center_y - 70),
        (globe_center_x + 10, globe_center_y - 70),
        (globe_center_x + 20, globe_center_y - 60),
        (globe_center_x + 25, globe_center_y - 40),
        (globe_center_x + 20, globe_center_y - 30),
        (globe_center_x - 20, globe_center_y - 30),
    ]
    draw.polygon(europe_points, fill=vibrant_green)
    
    # Asia/Arabian Peninsula (to the right)
    asia_points = [
        (globe_center_x + 30, globe_center_y - 20),
        (globe_center_x + 50, globe_center_y - 10),
        (globe_center_x + 60, globe_center_y + 10),
        (globe_center_x + 55, globe_center_y + 30),
        (globe_center_x + 40, globe_center_y + 20),
        (globe_center_x + 35, globe_center_y + 10),
    ]
    draw.polygon(asia_points, fill=vibrant_green)
    
    # Draw three curved green lines on the left
    line_start_x = globe_center_x - globe_width // 2 - 40
    for i in range(3):
        offset = i * 15
        # Create curved path
        points = []
        for t in range(0, 100):
            x_ratio = t / 100.0
            # Curve outward (concave toward globe)
            x = line_start_x - 80 * x_ratio
            y_offset = 30 * math.sin(x_ratio * math.pi)  # Curved shape
            y = globe_center_y - 60 + y_offset + offset
            points.append((x, y))
        
        # Draw thick curved line
        for j in range(len(points) - 1):
            draw.line([points[j], points[j+1]], fill=vibrant_green, width=8)
    
    # Draw three curved green lines on the right
    line_start_x = globe_center_x + globe_width // 2 + 40
    for i in range(3):
        offset = i * 15
        # Create curved path
        points = []
        for t in range(0, 100):
            x_ratio = t / 100.0
            # Curve outward (concave toward globe)
            x = line_start_x + 80 * x_ratio
            y_offset = 30 * math.sin(x_ratio * math.pi)  # Curved shape
            y = globe_center_y - 60 + y_offset + offset
            points.append((x, y))
        
        # Draw thick curved line
        for j in range(len(points) - 1):
            draw.line([points[j], points[j+1]], fill=vibrant_green, width=8)
    
    return img

def make_white_transparent(img):
    """Make all white pixels transparent"""
    pixels = img.load()
    width, height = img.size
    
    transparent_count = 0
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Make white and near-white pixels transparent
            if r >= 245 and g >= 245 and b >= 245:
                pixels[x, y] = (r, g, b, 0)
                transparent_count += 1
    
    print(f"Made {transparent_count} white pixels transparent")
    return img

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(script_dir)
    logo_path = os.path.join(web_dir, "public", "images", "logo.png")
    
    print("Creating logo version 2 (white background, green continents, blue oceans, green lines)...")
    img = create_logo_v2()
    
    print("Making white parts transparent...")
    img = make_white_transparent(img)
    
    img.save(logo_path, "PNG")
    print(f"Logo saved to: {logo_path}")
    print("Done!")
