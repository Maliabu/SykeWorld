# SSL Certificate Fix for uploads.sykeworld.com

## Problem

You're getting this error:
```
ERR_TLS_CERT_ALTNAME_INVALID
Host: uploads.sykeworld.com is not in the cert's altnames: DNS:*.web-hosting.com, DNS:web-hosting.com
```

This means your subdomain `uploads.sykeworld.com` is using a certificate for `*.web-hosting.com` instead of your actual domain.

## Solutions

### Option 1: Fix SSL Certificate on cPanel (Recommended)

1. **Log in to cPanel**
2. **Go to SSL/TLS Status** (or **SSL/TLS** → **Manage SSL Sites**)
3. **Find `uploads.sykeworld.com`** in the list
4. **Install a proper SSL certificate:**
   - If you have a Let's Encrypt certificate, install it for the subdomain
   - Or use AutoSSL (cPanel will automatically generate a free certificate)
   - Or purchase/install a certificate that covers `uploads.sykeworld.com`

5. **Wait for certificate to activate** (usually a few minutes)

### Option 2: Use AutoSSL (Easiest)

1. **Log in to cPanel**
2. **Go to SSL/TLS Status**
3. **Click "Run AutoSSL"** or wait for it to run automatically
4. **Ensure `uploads.sykeworld.com` is included** in AutoSSL
5. **Wait for certificate generation** (can take up to 24 hours, usually faster)

### Option 3: Temporary Workaround (Development Only)

If you need to test immediately while fixing the certificate:

1. **Add to `.env.local`:**
   ```env
   CPANEL_IGNORE_SSL=true
   ```

2. **⚠️ WARNING:** This disables SSL verification. **ONLY use in development!**

3. **Restart your Next.js server**

### Option 4: Use HTTP Instead of HTTPS (Not Recommended)

Only if you're in a completely isolated development environment:

1. **Change `.env.local`:**
   ```env
   CPANEL_UPLOAD_URL=http://uploads.sykeworld.com/editor
   ```

2. **⚠️ WARNING:** This sends data unencrypted. **NEVER use in production!**

## Verify the Fix

After fixing the certificate, test it:

```bash
curl -I https://uploads.sykeworld.com/editor
```

You should see:
- `HTTP/2 200` or similar (not certificate errors)
- No SSL warnings

## Check Certificate Details

To verify the certificate is correct:

```bash
openssl s_client -connect uploads.sykeworld.com:443 -servername uploads.sykeworld.com
```

Look for:
- `CN=uploads.sykeworld.com` or
- `DNS:uploads.sykeworld.com` in the Subject Alternative Name

## Contact Your Hosting Provider

If you can't fix it yourself, contact your hosting provider and ask them to:
1. Install a proper SSL certificate for `uploads.sykeworld.com`
2. Ensure the certificate covers the subdomain (not just the main domain)
3. Enable AutoSSL for the subdomain

## Production Checklist

Before going to production:
- [ ] SSL certificate is properly installed for `uploads.sykeworld.com`
- [ ] Certificate is valid (not expired)
- [ ] Certificate matches the domain (not showing hosting provider's certificate)
- [ ] `CPANEL_IGNORE_SSL` is NOT set to `true`
- [ ] Using HTTPS (not HTTP) in production


