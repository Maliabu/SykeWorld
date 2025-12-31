# cPanel Image Upload Setup - Step by Step Guide

This guide will walk you through setting up image uploads to your cPanel hosted server.

## Overview

Your Next.js application is already configured to upload images to cPanel. You just need to:
1. Set up the upload handler on your cPanel server
2. Configure environment variables
3. Set proper permissions
4. Test the upload

---

## Step 1: Create Upload Handler on cPanel Server

You need to create a PHP file on your cPanel server that will receive and store uploaded images.

### Option A: Using cPanel File Manager

1. **Log into your cPanel**
2. **Open File Manager**
3. **Navigate to `public_html`** (or your domain's root directory)
4. **Create a new folder** called `uploads` (if it doesn't exist)
5. **Inside `uploads` folder, create a new file** called `editor.php`

### Option B: Using FTP/SFTP

1. Connect to your cPanel server via FTP/SFTP
2. Navigate to `public_html/uploads/`
3. Create a new file `editor.php`

---

## Step 2: Add PHP Upload Handler Code

Copy and paste this code into `editor.php`:

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

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file provided']);
    exit;
}

$file = $_FILES['file'];
$uploadDir = __DIR__ . '/images/';
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
$maxSize = 10 * 1024 * 1024; // 10MB

// Validate file type
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

// Create upload directory if it doesn't exist
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique filename
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$filename = uniqid() . '_' . time() . '.' . $extension;
$filepath = $uploadDir . $filename;

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $filepath)) {
    // Get your domain (adjust this to match your actual domain)
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $baseUrl = $protocol . '://' . $host;
    
    // Return the URL
    $fileUrl = $baseUrl . '/uploads/images/' . $filename;
    
    echo json_encode([
        'url' => $fileUrl,
        'fileUrl' => $fileUrl,
        'path' => $fileUrl,
        'location' => $fileUrl,
        'success' => true
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to upload file']);
}
?>
```

**Important:** Replace `$host` with your actual domain if needed. For example:
- If your domain is `yourdomain.com`, the URL will be: `https://yourdomain.com/uploads/images/filename.jpg`
- If you're using a subdomain like `uploads.yourdomain.com`, adjust accordingly

---

## Step 3: Create Images Directory

1. **In cPanel File Manager**, navigate to `public_html/uploads/`
2. **Create a new folder** called `images`
3. **Set permissions** to `755` (right-click → Change Permissions → 755)

---

## Step 4: Set Directory Permissions

Set the following permissions:

- `uploads/` folder: **755**
- `uploads/images/` folder: **755**
- `uploads/editor.php` file: **644**

**How to set permissions in cPanel:**
1. Right-click on the file/folder
2. Select "Change Permissions"
3. Enter the permission number (755 or 644)
4. Click "Change Permissions"

---

## Step 5: Configure Environment Variable

1. **In your Next.js project**, create or edit `.env.local` file in the `web` folder
2. **Add this line:**

```env
CPANEL_UPLOAD_URL=https://yourdomain.com/uploads/editor.php
```

**Replace `yourdomain.com` with your actual domain.**

**Examples:**
- If your domain is `sykeworld.com`: `CPANEL_UPLOAD_URL=https://sykeworld.com/uploads/editor.php` (recommended)
- If using a subdomain: `CPANEL_UPLOAD_URL=https://uploads.sykeworld.com/editor.php` (not recommended - use main domain instead)

---

## Step 6: Update PHP Settings (if needed)

If you need to upload larger files, update your PHP settings:

1. **In cPanel**, go to **Select PHP Version** or **MultiPHP INI Editor**
2. **Set these values:**
   - `upload_max_filesize = 10M` (or higher)
   - `post_max_size = 10M` (or higher)
   - `memory_limit = 128M` (or higher)

---

## Step 7: Test the Upload

### Test via Browser

1. Open your browser
2. Go to: `https://yourdomain.com/uploads/editor.php`
3. You should see a JSON error (this is normal - it expects a POST request)

### Test via cURL (Command Line)

```bash
curl -X POST https://yourdomain.com/uploads/editor.php \
  -F "file=@/path/to/your/test-image.jpg"
```

**Expected response:**
```json
{
  "url": "https://yourdomain.com/uploads/images/abc123_1234567890.jpg",
  "fileUrl": "https://yourdomain.com/uploads/images/abc123_1234567890.jpg",
  "success": true
}
```

### Test via Your Application

1. **Start your Next.js app**: `npm run dev`
2. **Go to any page that uploads images** (e.g., Add Room, Gallery, Profile)
3. **Upload an image**
4. **Check if it appears** and the URL points to your cPanel server

---

## Step 8: Verify File Structure

Your cPanel file structure should look like this:

```
public_html/
├── uploads/
│   ├── editor.php
│   └── images/
│       └── (uploaded images will appear here)
```

---

## Troubleshooting

### Issue: "Failed to upload to cPanel server"

**Solutions:**
1. ✅ Check that `CPANEL_UPLOAD_URL` in `.env.local` is correct
2. ✅ Verify `editor.php` exists at the correct path
3. ✅ Check file permissions (755 for folders, 644 for PHP file)
4. ✅ Check PHP error logs in cPanel
5. ✅ Verify the `images/` folder exists and has 755 permissions
6. ✅ Test the endpoint directly with cURL

### Issue: "No file URL returned from server"

**Solutions:**
1. ✅ Check that `editor.php` returns JSON in the correct format
2. ✅ Verify the response includes `url` or `fileUrl` field
3. ✅ Check PHP error logs
4. ✅ Ensure the file was actually saved to the `images/` folder

### Issue: "CORS errors"

**Solutions:**
1. ✅ The PHP handler already includes CORS headers
2. ✅ If still having issues, check your server's `.htaccess` file
3. ✅ Verify your domain is correct in the environment variable

### Issue: "File too large"

**Solutions:**
1. ✅ Increase `$maxSize` in `editor.php` (currently 10MB)
2. ✅ Update PHP settings in cPanel (`upload_max_filesize`, `post_max_size`)
3. ✅ Check your server's overall upload limits

### Issue: "Permission denied"

**Solutions:**
1. ✅ Set `uploads/` folder to 755
2. ✅ Set `uploads/images/` folder to 755
3. ✅ Set `editor.php` to 644
4. ✅ Ensure the web server user can write to the `images/` folder

---

## Security Recommendations

### Option 1: Add API Key Authentication

**In `.env.local`:**
```env
CPANEL_UPLOAD_API_KEY=your-secret-key-here-12345
```

**Update `editor.php`** (add after line 12):
```php
// API Key authentication
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
$expectedKey = 'your-secret-key-here-12345'; // Match the one in .env.local

if ($apiKey !== $expectedKey) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
```

**Update `web/app/api/server/route.ts`** (add after line 3):
```typescript
const apiKey = process.env.CPANEL_UPLOAD_API_KEY;
```

**Update the fetch call** (line 19):
```typescript
const response = await fetch(cpanelUrl, {
  method: 'POST',
  headers: {
    'X-API-Key': apiKey || '',
  },
  body: uploadFormData,
});
```

### Option 2: IP Whitelist

**Add to `editor.php`** (after line 12):
```php
// IP Whitelist (optional)
$allowedIPs = ['your-server-ip-address'];
$clientIP = $_SERVER['REMOTE_ADDR'];

if (!in_array($clientIP, $allowedIPs)) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}
```

---

## Current Implementation Details

### How It Works

1. **User selects image** in the Next.js app
2. **Frontend calls** `uploadServerFile()` from `web/server/fetch.actions.ts`
3. **Server action sends** file to `/api/server` route
4. **API route** (`web/app/api/server/route.ts`) forwards to your cPanel server
5. **cPanel PHP handler** (`editor.php`) saves the file and returns URL
6. **URL is stored** in the database for use throughout the app

### Files That Use Image Upload

- Room images (`/admin/dashboard/rooms`)
- Gallery images (`/admin/dashboard/gallery`)
- Profile pictures (`/admin/dashboard/profile`)
- Menu item images (`/admin/dashboard/pos/menu-items`)
- Drink images (`/admin/dashboard/pos/drinks`)

---

## Quick Checklist

- [ ] Created `uploads/editor.php` on cPanel server
- [ ] Created `uploads/images/` folder
- [ ] Set folder permissions to 755
- [ ] Set PHP file permissions to 644
- [ ] Added `CPANEL_UPLOAD_URL` to `.env.local`
- [ ] Updated PHP settings if needed (file size limits)
- [ ] Tested upload endpoint
- [ ] Tested upload from the application
- [ ] Verified images appear at the correct URLs
- [ ] (Optional) Added API key authentication

---

## Need Help?

If you encounter issues:
1. Check cPanel error logs
2. Check browser console for errors
3. Check Next.js server logs
4. Verify all file paths and permissions
5. Test the PHP endpoint directly with cURL

Once set up, all image uploads in your application will automatically go to your cPanel server! 🎉

