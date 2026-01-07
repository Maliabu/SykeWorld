"""
Create accurate logo matching the description:
- White background
- Vertical oval globe
- Green continents (Africa, Europe, Asia)
- Blue oceans
- Double border: inner white, outer dark blue
- Three parallel curved green lines on left and right
Then make white transparent
"""
from PIL import Image, ImageDraw
import math
import os

def create_accurate_logo():
    """Create logo matching the exact description"""
    width, height = 1000, 800
    img = Image.new('RGBA', (width, height), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = width // 2, height // 2
    
    # Globe dimensions (vertical oval - taller than wide)
    globe_width = 240
    globe_height = 320
    globe_center_x = center_x
    globe_center_y = center_y
    
    # Colors
    vibrant_green = (34, 139, 34)  # Medium green for continents and lines
    deep_blue = (0, 0, 139)  # Deep blue for oceans
    dark_blue_border = (0, 32, 96)  # Dark blue for outer border
    white = (255, 255, 255, 255)
    
    # Draw outer dark blue border first
    draw.ellipse([
        globe_center_x - globe_width // 2 - 6,
        globe_center_y - globe_height // 2 - 6,
        globe_center_x + globe_width // 2 + 6,
        globe_center_y + globe_height // 2 + 6
    ], outline=dark_blue_border, width=5)
    
    # Draw inner white border
    draw.ellipse([
        globe_center_x - globe_width // 2 - 3,
        globe_center_y - globe_height // 2 - 3,
        globe_center_x + globe_width // 2 + 3,
        globe_center_y + globe_height // 2 + 3
    ], outline=white, width=3)
    
    # Draw blue ocean (fill the globe)
    draw.ellipse([
        globe_center_x - globe_width // 2,
        globe_center_y - globe_height // 2,
        globe_center_x + globe_width // 2,
        globe_center_y + globe_height // 2
    ], fill=deep_blue)
    
    # Draw green continents - Africa (centered, prominent)
    # Africa shape - simplified but recognizable
    africa_y_start = globe_center_y - 20
    africa_y_end = globe_center_y + 100
    
    # Draw Africa as a simplified shape
    africa_points = []
    # Left side of Africa
    for y in range(int(africa_y_start), int(africa_y_end), 5):
        x_offset = 0
        if y < globe_center_y - 10:
            x_offset = -15
        elif y < globe_center_y + 20:
            x_offset = -25
        elif y < globe_center_y + 60:
            x_offset = -30
        else:
            x_offset = -20
        africa_points.append((globe_center_x + x_offset, y))
    
    # Right side of Africa (mirror with some variation)
    for y in range(int(africa_y_end), int(africa_y_start), -5):
        x_offset = 0
        if y > globe_center_y + 80:
            x_offset = 15
        elif y > globe_center_y + 40:
            x_offset = 25
        elif y > globe_center_y:
            x_offset = 30
        else:
            x_offset = 20
        africa_points.append((globe_center_x + x_offset, y))
    
    if len(africa_points) > 2:
        draw.polygon(africa_points, fill=vibrant_green)
    
    # Europe (above Africa, smaller)
    europe_y_start = globe_center_y - 80
    europe_y_end = globe_center_y - 20
    europe_points = [
        (globe_center_x - 30, europe_y_start + 20),
        (globe_center_x - 25, europe_y_start),
        (globe_center_x - 15, europe_y_start - 10),
        (globe_center_x, europe_y_start - 15),
        (globe_center_x + 15, europe_y_start - 10),
        (globe_center_x + 25, europe_y_start),
        (globe_center_x + 30, europe_y_start + 20),
        (globe_center_x + 25, europe_y_end),
        (globe_center_x - 25, europe_y_end),
    ]
    draw.polygon(europe_points, fill=vibrant_green)
    
    # Asia/Arabian Peninsula (to the right of center)
    asia_points = [
        (globe_center_x + 40, globe_center_y - 30),
        (globe_center_x + 70, globe_center_y - 20),
        (globe_center_x + 80, globe_center_y),
        (globe_center_x + 75, globe_center_y + 30),
        (globe_center_x + 60, globe_center_y + 40),
        (globe_center_x + 45, globe_center_y + 20),
        (globe_center_x + 42, globe_center_y),
    ]
    draw.polygon(asia_points, fill=vibrant_green)
    
    # Draw three curved green lines on the LEFT side
    # Lines curve outward (concave toward globe)
    left_start_x = globe_center_x - globe_width // 2 - 50
    line_spacing = 20
    line_length = 120
    
    for line_idx in range(3):
        line_y_offset = (line_idx - 1) * line_spacing
        line_center_y = globe_center_y + line_y_offset
        
        # Create curved path using bezier-like curve
        points = []
        for t in range(0, 101):
            t_ratio = t / 100.0
            # Curve that goes left and curves
            x = left_start_x - line_length * t_ratio
            # Curved shape - starts and ends at same y, curves in middle
            curve = math.sin(t_ratio * math.pi) * 40
            y = line_center_y + curve
            points.append((x, y))
        
        # Draw thick line
        for i in range(len(points) - 1):
            draw.line([points[i], points[i+1]], fill=vibrant_green, width=10)
    
    # Draw three curved green lines on the RIGHT side (mirror)
    right_start_x = globe_center_x + globe_width // 2 + 50
    
    for line_idx in range(3):
        line_y_offset = (line_idx - 1) * line_spacing
        line_center_y = globe_center_y + line_y_offset
        
        # Create curved path
        points = []
        for t in range(0, 101):
            t_ratio = t / 100.0
            # Curve that goes right and curves
            x = right_start_x + line_length * t_ratio
            # Curved shape
            curve = math.sin(t_ratio * math.pi) * 40
            y = line_center_y + curve
            points.append((x, y))
        
        # Draw thick line
        for i in range(len(points) - 1):
            draw.line([points[i], points[i+1]], fill=vibrant_green, width=10)
    
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
            # Check both pure white and the white border
            if (r >= 245 and g >= 245 and b >= 245):
                pixels[x, y] = (r, g, b, 0)
                transparent_count += 1
    
    print(f"Made {transparent_count} white pixels transparent")
    return img

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(script_dir)
    logo_path = os.path.join(web_dir, "public", "images", "logo.png")
    
    print("Creating accurate logo (white bg, green continents, blue oceans, green lines)...")
    img = create_accurate_logo()
    
    print("Making white background and borders transparent...")
    img = make_white_transparent(img)
    
    img.save(logo_path, "PNG")
    print(f"Logo saved to: {logo_path}")
    print("Done!")
