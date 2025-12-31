# Quick Upload Setup - Fix 404 Error

## The Problem

You're getting a 404 error because the `editor.php` file doesn't exist on your server at `https://sykeworld.com/uploads/editor`.

## Quick Fix (5 minutes)

### Step 1: Upload the PHP File to cPanel

1. **Log in to cPanel**
2. **Open File Manager**
3. **Navigate to `public_html`**
4. **Create a folder called `uploads`** (if it doesn't exist)
5. **Upload the file `web/uploads/editor.php`** to `public_html/uploads/editor.php`

### Step 2: Set File Permissions

1. **Right-click on `editor.php`** in File Manager
2. **Select "Change Permissions"**
3. **Set to `644`** (or `755` if needed)
4. **Click "Change Permissions"**

### Step 3: Test the Endpoint

Open in your browser:
```
https://sykeworld.com/uploads/editor
```

You should see:
- **If it works:** A JSON error like `{"error":"Method not allowed"}` (this is OK - it means the file exists!)
- **If it doesn't work:** Still a 404 error

### Step 4: Verify Your .env.local

Make sure your `.env.local` has:
```env
CPANEL_UPLOAD_URL=https://sykeworld.com/uploads/editor
```

### Step 5: Restart Your Next.js Server

After uploading the file:
```bash
# Stop your server (Ctrl+C)
# Then restart:
npm run dev
```

## File Structure on cPanel

Your cPanel should have this structure:
```
public_html/
  ├── uploads/
  │   ├── editor.php          ← Upload this file here
  │   ├── rooms/              ← Will be created automatically
  │   ├── gallery/            ← Will be created automatically
  │   └── general/            ← Will be created automatically
```

## Troubleshooting

### Still Getting 404?

1. **Check the file path:**
   - File should be at: `public_html/uploads/editor.php`
   - NOT at: `public_html/editor.php`
   - NOT at: `public_html/uploads/uploads/editor.php`

2. **Check file permissions:**
   - Should be `644` or `755`

3. **Check if PHP is enabled:**
   - The file should have `.php` extension
   - Your hosting should support PHP

4. **Test directly:**
   - Visit: `https://sykeworld.com/uploads/editor`
   - You should get a JSON response (even if it's an error)

### Getting "Method not allowed"?

This is actually GOOD! It means the file exists and is working. The error is expected because you're visiting it with GET instead of POST.

### Getting "No file uploaded"?

Also GOOD! The endpoint is working, it just needs a file in the POST request.

## Alternative: Use a Different Path

If you can't create the `uploads` folder, you can use:

1. **Update `.env.local`:**
   ```env
   CPANEL_UPLOAD_URL=https://sykeworld.com/api/uploads/editor
   ```

2. **Upload `editor.php` to:** `public_html/api/uploads/editor.php`

3. **Update the `$baseUrl` in `editor.php`** (line 96):
   ```php
   $baseUrl = $protocol . '://' . $host . '/api/uploads';
   ```

## Need the editor.php File?

The file is located at: `web/uploads/editor.php` in your project.

Copy its contents and create a new file in cPanel File Manager with that content.


