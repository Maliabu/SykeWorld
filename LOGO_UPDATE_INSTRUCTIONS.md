# Logo Update Instructions

## Task
Update the logo from green to orange and replace both the logo and favicon.

## Steps

### 1. Update Logo Colors
The current logo (`web/public/images/logo.png`) uses:
- **Green** for continents and sound waves: Change to **Orange** (#F97316 or rgb(249, 115, 22))
- **Black background**: Keep as is
- **Dark grey oceans**: Keep as is

### 2. Tools You Can Use

#### Option A: Online Image Editor (Easiest)
1. Go to https://www.photopea.com/ (free, works in browser)
2. Upload `web/public/images/logo.png`
3. Go to **Image > Adjustments > Replace Color**
4. Select the green color
5. Set replacement color to orange (#F97316)
6. Export as PNG (File > Export As > PNG)
7. Save to `web/public/images/logo.png`

#### Option B: Photoshop/GIMP
1. Open the logo in your image editor
2. Use "Hue/Saturation" or "Color Replace" tool
3. Select green areas and replace with orange
4. Save as PNG

### 3. Create Favicon
After updating the logo:

1. **Option A: Online Converter**
   - Go to https://favicon.io/favicon-converter/
   - Upload your updated orange logo PNG
   - Download the favicon package
   - Extract `favicon.ico` to `web/app/favicon.ico`

2. **Option B: Manual Creation**
   - Resize logo to 32x32 or 48x48 pixels
   - Save as `web/app/favicon.ico`

### 4. Files to Update
- ✅ `web/public/images/logo.png` - Main logo (replace green with orange)
- ✅ `web/app/favicon.ico` - Browser favicon (use orange logo)

### 5. Color Reference
- **Orange (Primary)**: `#F97316` or `rgb(249, 115, 22)` (Tailwind orange-500)
- This matches your theme colors

## Note
The metadata in `web/app/layout.tsx` has been updated to use `/images/logo.png` as the favicon. Once you update the logo file, it will automatically be used.

