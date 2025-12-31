# cPanel Image Upload Configuration Guide

This guide explains how to configure your Next.js application to upload images to your cPanel server.

## Overview

The application uses a server action (`uploadServerFile`) that sends images to your cPanel server endpoint. The uploaded images are then stored on your cPanel server and the URL is returned for use in the application.

## Current Setup

The image upload flow works as follows:

1. **Frontend**: User selects an image file
2. **Server Action**: `web/server/fetch.actions.ts` → `uploadServerFile()` 
3. **API Route**: `web/app/api/server/route.ts` → Handles the upload
4. **cPanel Server**: `https://sykeworld.com/uploads/editor` → Receives and stores the file
5. **Response**: Returns the file URL back to the application

## Configuration Steps

### 1. Environment Variables

Add the following to your `.env.local` file:

```env
CPANEL_UPLOAD_URL=https://sykeworld.com/uploads/editor
```

Or if you want to use a different endpoint:

```env
CPANEL_UPLOAD_URL=https://yourdomain.com/upload-handler
```

### 2. cPanel Server Setup

You need to create an upload handler on your cPanel server. Here's a PHP example:

**File: `public_html/uploads/editor.php`** (or your upload directory)

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

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
$uploadDir = __DIR__ . '/uploads/';
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxSize = 10 * 1024 * 1024; // 10MB

// Validate file type
if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type']);
    exit;
}

// Validate file size
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large']);
    exit;
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid() . '_' . time() . '.' . $extension;
$filepath = $uploadDir . $filename;

// Create upload directory if it doesn't exist
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $filepath)) {
    // Return the URL
    $baseUrl = 'https://sykeworld.com/uploads';
    $fileUrl = $baseUrl . '/uploads/' . $filename;
    
    echo json_encode([
        'url' => $fileUrl,
        'fileUrl' => $fileUrl,
        'path' => $fileUrl,
        'location' => $fileUrl
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to upload file']);
}
?>
```

### 3. Alternative: Node.js/Express Handler

If you prefer Node.js, create a handler on your cPanel server:

**File: `upload-handler.js`**

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

app.post('/editor', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const fileUrl = `https://sykeworld.com/uploads/${req.file.filename}`;
  
  res.json({
    url: fileUrl,
    fileUrl: fileUrl,
    path: fileUrl,
    location: fileUrl
  });
});

app.listen(3001, () => {
  console.log('Upload server running on port 3001');
});
```

### 4. Directory Permissions

Ensure your upload directory has proper permissions:

```bash
# Via cPanel File Manager or SSH
chmod 755 uploads/
chmod 644 uploads/*
```

### 5. Security Considerations

#### Option A: API Key Authentication

Add an API key to secure your upload endpoint:

**In `.env.local`:**
```env
CPANEL_UPLOAD_URL=https://sykeworld.com/uploads/editor
CPANEL_UPLOAD_API_KEY=your-secret-api-key-here
```

**Update `web/app/api/server/route.ts`:**
```typescript
const cpanelUrl = process.env.CPANEL_UPLOAD_URL || 'https://sykeworld.com/uploads/editor';
const apiKey = process.env.CPANEL_UPLOAD_API_KEY;

// In the upload request:
const response = await fetch(cpanelUrl, {
  method: 'POST',
  headers: {
    'X-API-Key': apiKey, // Add this
  },
  body: uploadFormData,
});
```

**Update your PHP handler:**
```php
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
$expectedKey = 'your-secret-api-key-here';

if ($apiKey !== $expectedKey) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
```

#### Option B: IP Whitelist

Restrict access to your Next.js server IP only:

```php
$allowedIPs = ['your-nextjs-server-ip'];
$clientIP = $_SERVER['REMOTE_ADDR'];

if (!in_array($clientIP, $allowedIPs)) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}
```

### 6. Testing the Upload

Test your upload endpoint:

```bash
curl -X POST https://sykeworld.com/uploads/editor \
  -F "file=@/path/to/test-image.jpg"
```

Expected response:
```json
{
  "url": "https://sykeworld.com/uploads/abc123_1234567890.jpg",
  "fileUrl": "https://sykeworld.com/uploads/abc123_1234567890.jpg"
}
```

### 7. Troubleshooting

#### Issue: "Failed to upload to cPanel server"

**Solutions:**
- Check that `CPANEL_UPLOAD_URL` is correct
- Verify the upload handler exists and is accessible
- Check server logs for errors
- Ensure CORS headers are set correctly
- Verify file size limits (both Next.js and cPanel)

#### Issue: "No file URL returned from server"

**Solutions:**
- Check your upload handler returns the correct JSON format
- Ensure the response includes one of: `url`, `fileUrl`, `path`, or `location`
- Check server logs for errors

#### Issue: CORS errors

**Solutions:**
- Add CORS headers to your upload handler:
  ```php
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: POST');
  header('Access-Control-Allow-Headers: Content-Type');
  ```

### 8. File Size Limits

Update these if needed:

**Next.js API Route** (`web/app/api/server/route.ts`):
- Currently no explicit limit (relies on cPanel)

**cPanel PHP Handler:**
```php
$maxSize = 10 * 1024 * 1024; // 10MB - adjust as needed
```

**PHP `php.ini` settings:**
```ini
upload_max_filesize = 10M
post_max_size = 10M
```

### 9. Current Implementation

The current implementation in `web/app/api/server/route.ts`:

1. Receives FormData with a file
2. Forwards it to your cPanel server
3. Returns the file URL from the response

The code handles multiple possible response field names:
- `url`
- `fileUrl`
- `path`
- `location`

## Summary

1. Set `CPANEL_UPLOAD_URL` in `.env.local`
2. Create upload handler on cPanel server (PHP or Node.js)
3. Ensure proper directory permissions
4. Add security (API key or IP whitelist)
5. Test the upload endpoint
6. Monitor for errors

Your images will be uploaded to your cPanel server and URLs will be stored in the database for use throughout the application.

