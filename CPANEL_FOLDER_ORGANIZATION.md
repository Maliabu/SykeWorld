# cPanel Upload Folder Organization Guide

## Overview

You can use **ONE PHP file** (`editor.php`) that automatically organizes uploads into different folders based on category. This is cleaner and easier to maintain than having multiple files.

## Folder Structure

When you upload files, they will be organized like this:

```
public_html/
└── uploads/
    ├── editor.php          (the upload handler)
    ├── rooms/              (room images)
    ├── gallery/             (gallery images)
    ├── profiles/            (user profile pictures)
    ├── menu/                (menu item images)
    ├── drinks/              (drink images)
    ├── services/            (service icons)
    └── general/             (default folder for uncategorized uploads)
```

## How It Works

1. **Single PHP Handler**: `editor.php` handles all uploads
2. **Category Parameter**: Pass a `category` parameter with each upload
3. **Automatic Organization**: Files are saved to the appropriate folder based on category
4. **Default Fallback**: If no category is provided, files go to `general/` folder

## PHP Handler Code

Use this improved `editor.php` that organizes files into folders:

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if a file was uploaded
if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];

// Check for upload errors
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Upload failed with error code ' . $file['error']]);
    exit;
}

// Get category from POST data (optional, defaults to 'general')
$category = isset($_POST['category']) ? $_POST['category'] : 'general';

// Define allowed categories and their folder names
$allowedCategories = [
    'rooms' => 'rooms',
    'gallery' => 'gallery',
    'profile' => 'profiles',
    'menu' => 'menu',
    'drinks' => 'drinks',
    'services' => 'services',
    'general' => 'general'
];

// Sanitize category
$category = strtolower(trim($category));
if (!isset($allowedCategories[$category])) {
    $category = 'general';
}

$folderName = $allowedCategories[$category];

// Base upload directory
$baseUploadDir = __DIR__ . '/';
$categoryDir = $baseUploadDir . $folderName . '/';

// Create category directory if it doesn't exist
if (!is_dir($categoryDir)) {
    mkdir($categoryDir, 0755, true);
}

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
$maxSize = 10 * 1024 * 1024; // 10MB

if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.']);
    exit;
}

// Validate file size
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large. Maximum size is 10MB.']);
    exit;
}

// Sanitize filename (prevent directory traversal)
$originalFilename = basename($file['name']);
$extension = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));

// Generate unique filename to avoid overwriting
$uniqueFilename = uniqid() . '_' . time() . '.' . $extension;
$targetFile = $categoryDir . $uniqueFilename;

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $targetFile)) {
    // Get your domain
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $baseUrl = $protocol . '://' . $host;
    
    // Return the URL
    $fileUrl = $baseUrl . '/uploads/' . $folderName . '/' . $uniqueFilename;
    
    echo json_encode([
        'success' => true,
        'url' => $fileUrl,
        'fileUrl' => $fileUrl,
        'path' => $fileUrl,
        'location' => $fileUrl,
        'category' => $category,
        'folder' => $folderName
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to move uploaded file']);
}
?>
```

## Setup Instructions

1. **Create the uploads folder** in `public_html/`
2. **Upload `editor.php`** to `public_html/uploads/`
3. **Set permissions**:
   - `uploads/` folder: **755**
   - `editor.php` file: **644**
4. **Folders will be created automatically** when files are uploaded

## Using Categories in Your Code

### Option 1: Update Existing Upload Calls

When uploading, add the category:

```typescript
// For room images
const formData = new FormData();
formData.append("file", imageFile);
formData.append("category", "rooms"); // Add this
const imageUrl = await uploadServerFile(formData, "rooms");

// For gallery images
const formData = new FormData();
formData.append("file", imageFile);
const imageUrl = await uploadServerFile(formData, "gallery");

// For profile pictures
const formData = new FormData();
formData.append("file", imageFile);
const imageUrl = await uploadServerFile(formData, "profile");

// For menu items
const formData = new FormData();
formData.append("file", imageFile);
const imageUrl = await uploadServerFile(formData, "menu");

// For drinks
const formData = new FormData();
formData.append("file", imageFile);
const imageUrl = await uploadServerFile(formData, "drinks");

// For services
const formData = new FormData();
formData.append("file", imageFile);
const imageUrl = await uploadServerFile(formData, "services");
```

### Option 2: Update Specific Pages

**Room Images** (`web/app/admin/dashboard/rooms/page.tsx`):
```typescript
const formData = new FormData();
formData.append("file", file);
const url = await uploadServerFile(formData, "rooms");
```

**Gallery Images** (`web/app/admin/dashboard/gallery/page.tsx`):
```typescript
const formData = new FormData();
formData.append("file", newImageFile);
const imageUrl = await uploadServerFile(formData, "gallery");
```

**Profile Pictures** (`web/app/admin/dashboard/profile/page.tsx`):
```typescript
const formData = new FormData();
formData.append("file", file);
const url = await uploadServerFile(formData, "profile");
```

**Menu Items** (`web/app/admin/dashboard/pos/menu-items/page.tsx`):
```typescript
const formData = new FormData();
formData.append("file", file);
const url = await uploadServerFile(formData, "menu");
```

**Drinks** (`web/app/admin/dashboard/pos/drinks/page.tsx`):
```typescript
const formData = new FormData();
formData.append("file", file);
const url = await uploadServerFile(formData, "drinks");
```

## Available Categories

| Category | Folder Name | Use Case |
|----------|-------------|----------|
| `rooms` | `rooms/` | Room images |
| `gallery` | `gallery/` | Gallery images |
| `profile` | `profiles/` | User profile pictures |
| `menu` | `menu/` | Menu item images |
| `drinks` | `drinks/` | Drink images |
| `services` | `services/` | Service icons |
| `general` | `general/` | Default/uncategorized |

## Benefits of One File Approach

✅ **Easier to maintain** - One file to update  
✅ **Consistent behavior** - Same validation and security for all uploads  
✅ **Automatic organization** - Files sorted by category automatically  
✅ **Flexible** - Easy to add new categories  
✅ **Clean structure** - Organized folders without multiple PHP files  

## Adding New Categories

To add a new category, edit `editor.php` and add to the `$allowedCategories` array:

```php
$allowedCategories = [
    'rooms' => 'rooms',
    'gallery' => 'gallery',
    'profile' => 'profiles',
    'menu' => 'menu',
    'drinks' => 'drinks',
    'services' => 'services',
    'newcategory' => 'newcategory', // Add this
    'general' => 'general'
];
```

## Security Notes

- ✅ File type validation (only images)
- ✅ File size limits (10MB)
- ✅ Filename sanitization (prevents directory traversal)
- ✅ Unique filenames (prevents overwriting)
- ✅ Category validation (only allowed categories)

## Testing

Test with different categories:

```bash
# Test room upload
curl -X POST https://yourdomain.com/uploads/editor.php \
  -F "file=@room.jpg" \
  -F "category=rooms"

# Test gallery upload
curl -X POST https://yourdomain.com/uploads/editor.php \
  -F "file=@gallery.jpg" \
  -F "category=gallery"
```

Expected response:
```json
{
  "success": true,
  "url": "https://yourdomain.com/uploads/rooms/abc123_1234567890.jpg",
  "fileUrl": "https://yourdomain.com/uploads/rooms/abc123_1234567890.jpg",
  "category": "rooms",
  "folder": "rooms"
}
```

## Summary

**Use ONE file (`editor.php`)** that automatically organizes uploads into folders based on the `category` parameter. This is cleaner, easier to maintain, and more flexible than having multiple PHP files.



