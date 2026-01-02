# Google OAuth Setup Guide

This guide explains how to fix the "redirect_uri_mismatch" error when using Google Sign-In.

## Understanding the Error

**Error 400: redirect_uri_mismatch** occurs when the redirect URI in your Google Cloud Console doesn't match what NextAuth is trying to use.

## NextAuth Callback URL

NextAuth automatically uses this callback URL format:
```
http://localhost:3000/api/auth/callback/google
```

For production, it would be:
```
https://yourdomain.com/api/auth/callback/google
```

## Step-by-Step Fix

### Step 1: Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**

### Step 2: Find Your OAuth 2.0 Client

1. Under **OAuth 2.0 Client IDs**, find your client (or create one if you don't have it)
2. Click on the client name to edit it

### Step 3: Add Authorized Redirect URIs

In the **Authorized redirect URIs** section, add these URIs:

#### For Local Development (localhost):
```
http://localhost:3000/api/auth/callback/google
```

#### For Production:
```
https://yourdomain.com/api/auth/callback/google
```

#### If you're using a custom port:
```
http://localhost:PORT/api/auth/callback/google
```
(Replace `PORT` with your actual port number, e.g., `3001`, `3002`, etc.)

### Step 4: Save Changes

1. Click **Save** at the bottom
2. Wait a few seconds for changes to propagate (Google says it can take up to 5 minutes, but usually it's instant)

### Step 5: Verify Your Environment Variables

Make sure your `.env` (or `.env.local`) file has:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

**Important Notes:**
- `NEXTAUTH_URL` should match your development URL (e.g., `http://localhost:3000`)
- `NEXTAUTH_SECRET` should be a random string (at least 32 characters)
- You can generate a secret with: `openssl rand -base64 32`
- **Note:** The code supports both `.env` and `.env.local` files. Use whichever you prefer.

### Step 6: Restart Your Server

After making changes:
1. Stop your Next.js server (Ctrl+C)
2. Restart it:
   ```bash
   npm run dev
   ```

## Common Issues and Solutions

### Issue: Still getting redirect_uri_mismatch after adding URI

**Solutions:**
1. **Double-check the exact URL**: Make sure there are no typos, extra spaces, or trailing slashes
2. **Check your port**: If you're running on a different port (not 3000), update both:
   - The redirect URI in Google Console
   - The `NEXTAUTH_URL` in `.env.local`
3. **Wait a few minutes**: Google sometimes takes a few minutes to propagate changes
4. **Clear browser cache**: Try clearing your browser cache or using an incognito window
5. **Check for HTTP vs HTTPS**: Make sure you're using `http://` for localhost (not `https://`)

### Issue: Multiple redirect URIs

You can add multiple redirect URIs in Google Console:
- One for localhost: `http://localhost:3000/api/auth/callback/google`
- One for production: `https://yourdomain.com/api/auth/callback/google`
- One for staging: `https://staging.yourdomain.com/api/auth/callback/google`

### Issue: Using a custom domain or ngrok

If you're using ngrok or a custom domain for localhost:

1. **For ngrok**: Add the ngrok URL:
   ```
   https://abc123.ngrok.io/api/auth/callback/google
   ```
   (Replace with your actual ngrok URL)

2. **Update NEXTAUTH_URL** in `.env.local`:
   ```env
   NEXTAUTH_URL=https://abc123.ngrok.io
   ```

3. **Note**: ngrok URLs change each time you restart ngrok, so you'll need to update both places

## Quick Checklist

- [ ] Added redirect URI to Google Cloud Console
- [ ] URI matches exactly: `http://localhost:3000/api/auth/callback/google`
- [ ] `GOOGLE_CLIENT_ID` is set in `.env.local`
- [ ] `GOOGLE_CLIENT_SECRET` is set in `.env.local`
- [ ] `NEXTAUTH_URL` is set in `.env.local` (matches your dev URL)
- [ ] `NEXTAUTH_SECRET` is set in `.env.local`
- [ ] Restarted the Next.js server
- [ ] Waited a few minutes for Google to propagate changes
- [ ] Tried in incognito/private window

## Testing

1. Go to your auth page: `http://localhost:3000/auth`
2. Click "Continue with Google"
3. You should be redirected to Google's sign-in page
4. After signing in, you should be redirected back to your app

If you still get the error, check the browser console and server logs for more details.

## Troubleshooting: Redirect URI Already Set But Still Getting Error

If your redirect URI is already correctly set in Google Console but you're still getting the error:

### 1. Check Your Environment Variables

Make sure your `web/.env.local` file has ALL of these:

```env
GOOGLE_CLIENT_ID=1094679773004-562n19nev22b36rbdfnInv03r37b0pll.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-min-32-chars
```

**Important:**
- `NEXTAUTH_SECRET` is required - generate one with: `openssl rand -base64 32`
- `NEXTAUTH_URL` must match exactly: `http://localhost:3000` (no trailing slash)

### 2. Restart Your Server

After updating `.env.local`:
```bash
# Stop the server completely (Ctrl+C)
# Then restart:
cd web
npm run dev
```

### 3. Clear Browser Cache

- Try in an **incognito/private window**
- Or clear your browser cache and cookies for localhost
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### 4. Check Your Port Number

If you're running on a different port (not 3000):
- Update `NEXTAUTH_URL` in `.env.local`: `http://localhost:YOUR_PORT`
- Update the redirect URI in Google Console: `http://localhost:YOUR_PORT/api/auth/callback/google`

### 5. Wait for Google to Propagate

Sometimes Google takes a few minutes to recognize changes. Wait 2-5 minutes and try again.

### 6. Check Server Logs

Look at your terminal where the Next.js server is running. You should see:
- Any errors related to NextAuth
- The actual redirect URI being used

### 7. Verify the Exact Error

Check the browser's developer console (F12) for the exact error message. Sometimes the error details will show what redirect URI NextAuth is trying to use vs what Google expects.

## Production Deployment

When deploying to production:

1. **Add production redirect URI** in Google Console:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

2. **Update environment variables** in your hosting platform:
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   NEXTAUTH_SECRET=your-secret
   ```

3. **Test the production flow** before going live

## Need More Help?

- [NextAuth.js Documentation](https://next-auth.js.org/configuration/providers/oauth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- Check your server logs for detailed error messages
