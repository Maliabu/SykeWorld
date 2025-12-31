# Testing the Upload Endpoint

## Quick Test

The 404 error suggests the file path might be slightly different. Let's verify:

### Test 1: Check the exact URL

The code is trying to POST to: `https://sykeworld.com/uploads/editor.php`

But you visited: `sykeworld.com/uploads/editor.php` (without https?)

### Test 2: Verify File Location in cPanel

1. **Log in to cPanel**
2. **Open File Manager**
3. **Navigate to `public_html/uploads/`**
4. **Verify `editor.php` exists there**
5. **Check the exact file path shown in File Manager**

### Test 3: Test with curl (from your computer)

```bash
curl -X POST https://sykeworld.com/uploads/editor.php \
  -F "file=@test.jpg" \
  -F "category=rooms"
```

If this works, the file is correct. If it gives 404, the path is wrong.

### Common Issues

1. **File is in wrong location:**
   - Should be: `public_html/uploads/editor.php`
   - NOT: `public_html/editor.php`
   - NOT: `public_html/uploads/uploads/editor.php`

2. **Case sensitivity:**
   - Make sure it's exactly `editor.php` (lowercase)
   - Not `Editor.php` or `EDITOR.PHP`

3. **File permissions:**
   - Should be `644` or `755`

4. **.htaccess blocking:**
   - Check if there's a `.htaccess` file blocking POST requests
   - Or redirecting `/uploads/` to somewhere else

### Quick Fix: Try Different Paths

If the file is in a different location, update your `.env.local`:

```env
# Try these one by one:
CPANEL_UPLOAD_URL=https://sykeworld.com/uploads/editor.php
# OR
CPANEL_UPLOAD_URL=https://www.sykeworld.com/uploads/editor.php
# OR if file is directly in public_html:
CPANEL_UPLOAD_URL=https://sykeworld.com/editor.php
```

Then restart your Next.js server.


