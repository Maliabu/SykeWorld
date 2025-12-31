# Fixing SSL for uploads.sykeworld.com Subdomain

## Problem

You're getting errors like:
- "SSL/TLS fails to add the subdomain saying I don't control the domain"
- "SSL/TLS Status doesn't show all domains with no option to add"

This means the subdomain `uploads.sykeworld.com` is not properly configured in cPanel.

## Solutions

### Option 1: Add Subdomain in cPanel (Recommended)

1. **Log in to cPanel**
2. **Go to "Subdomains"** (or "Subdomain" in the Domains section)
3. **Check if `uploads` subdomain exists:**
   - Look for `uploads.sykeworld.com` in the list
   - If it doesn't exist, create it

4. **Create the subdomain if missing:**
   - Click "Create a Subdomain"
   - Subdomain: `uploads`
   - Domain: `sykeworld.com` (select from dropdown)
   - Document Root: Usually auto-filled (e.g., `public_html/uploads` or `uploads`)
   - Click "Create"

5. **Wait a few minutes** for DNS to propagate

6. **Go back to SSL/TLS Status**
   - The subdomain should now appear
   - AutoSSL should automatically generate a certificate

### Option 2: Verify DNS Records

The subdomain needs proper DNS records:

1. **Check DNS Records:**
   - Go to cPanel → **Zone Editor** (or **Advanced DNS Zone Editor**)
   - Look for `uploads` A record pointing to your server IP
   - If missing, add it:
     - Name: `uploads`
     - Type: `A`
     - Address: Your server's IP address
     - TTL: `14400` (or default)

2. **Verify DNS propagation:**
   ```bash
   # Check if DNS is resolving
   nslookup uploads.sykeworld.com
   # or
   dig uploads.sykeworld.com
   ```
   
   Should return your server's IP address.

### Option 3: Use Main Domain Instead (Quick Fix)

If you can't get the subdomain working, use the main domain:

1. **Update `.env.local`:**
   ```env
   CPANEL_UPLOAD_URL=https://sykeworld.com/uploads/editor
   ```

2. **Create the uploads directory:**
   - In cPanel File Manager, go to `public_html`
   - Create folder: `uploads`
   - Upload your `editor.php` to `public_html/uploads/editor.php`

3. **Update the editor.php base URL:**
   ```php
   $baseUrl = 'https://sykeworld.com/uploads';
   ```

### Option 4: Use a Different Path on Main Domain

Instead of a subdomain, use a path:

1. **Update `.env.local`:**
   ```env
   CPANEL_UPLOAD_URL=https://sykeworld.com/api/uploads
   ```

2. **Create the path:**
   - In cPanel File Manager: `public_html/api/uploads/`
   - Upload `editor.php` there

3. **Update editor.php:**
   ```php
   $baseUrl = 'https://sykeworld.com/api/uploads';
   ```

### Option 5: Contact Your Hosting Provider

If none of the above works:

1. **Contact your hosting provider** and ask them to:
   - Add the `uploads` subdomain to your cPanel account
   - Configure DNS records for `uploads.sykeworld.com`
   - Enable AutoSSL for the subdomain
   - Install an SSL certificate for the subdomain

2. **Provide them with:**
   - Domain: `sykeworld.com`
   - Subdomain: `uploads.sykeworld.com`
   - Purpose: File uploads for web application

### Option 6: Use Cloudflare or CDN (Advanced)

If you're using Cloudflare:

1. **Add subdomain in Cloudflare:**
   - Go to Cloudflare dashboard
   - Add `uploads` as a subdomain
   - Point it to your server IP
   - Enable "Full" SSL mode

2. **Cloudflare will handle SSL** automatically

## Verification Steps

After fixing, verify:

1. **Check subdomain exists:**
   ```bash
   curl -I https://uploads.sykeworld.com
   ```

2. **Check SSL certificate:**
   ```bash
   openssl s_client -connect uploads.sykeworld.com:443 -servername uploads.sykeworld.com
   ```

3. **Test upload endpoint:**
   ```bash
   curl -X POST https://uploads.sykeworld.com/editor \
     -F "file=@test.jpg" \
     -F "category=test"
   ```

## Quick Workaround (Temporary)

While fixing the subdomain, you can:

1. **Set in `.env.local`:**
   ```env
   CPANEL_IGNORE_SSL=true
   CPANEL_UPLOAD_URL=https://uploads.sykeworld.com/editor
   ```

2. **This allows uploads to work** while you fix the SSL certificate issue

## Recommended Solution

**Best approach:** Use Option 3 (main domain with path) or Option 4 (API path) because:
- ✅ No subdomain configuration needed
- ✅ Uses existing SSL certificate
- ✅ Easier to manage
- ✅ Works immediately

Update your `.env.local`:
```env
CPANEL_UPLOAD_URL=https://sykeworld.com/uploads/editor
```

Then move your `editor.php` to `public_html/uploads/editor.php` and update the `$baseUrl` in the PHP file.


