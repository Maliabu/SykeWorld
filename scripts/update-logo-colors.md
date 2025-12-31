# Logo Color Update Instructions

Since the logo needs to be updated from green to orange, here are the steps:

## Option 1: Using Image Editing Software (Recommended)

1. Open `web/public/images/logo.png` in an image editor (Photoshop, GIMP, or online tools like Photopea)
2. Use "Replace Color" or "Hue/Saturation" tool
3. Select the green color (#00FF00 or similar)
4. Replace with orange (#F97316 or rgb(249, 115, 22) - Tailwind orange-500)
5. Save as PNG maintaining original dimensions
6. Also save as `favicon.ico` (you may need to convert PNG to ICO format)

## Option 2: Using Online Tools

1. Go to https://www.photopea.com/ or similar online editor
2. Upload `web/public/images/logo.png`
3. Use color replacement tools to change green to orange
4. Export as PNG
5. For favicon, use https://favicon.io/favicon-converter/ to convert PNG to ICO

## Colors to Use

- **Orange (Primary)**: `#F97316` or `rgb(249, 115, 22)` (Tailwind orange-500)
- **Black Background**: Keep as is
- **Dark Grey Oceans**: Keep as is or make slightly lighter

## Files to Update

1. `web/public/images/logo.png` - Main logo
2. `web/app/favicon.ico` - Browser favicon (16x16, 32x32, or 48x48 recommended)

