# Environment Variables Check

## Quick Check for "Unauthorized" Error

If you're getting an "Unauthorized" toast error, check your `.env` or `.env.local` file in the `web` directory.

## Required Environment Variables

Create a file named `.env` (or `.env.local`) in the `web` directory with these variables:

**Note:** The code supports both `.env` and `.env.local` files. Use whichever you prefer.

```env
# Pesapal Payment Gateway (REQUIRED for payments)
PESAPAL_CONSUMER_KEY=your-consumer-key-here
PESAPAL_CONSUMER_SECRET=your-consumer-secret-here
PESAPAL_CALLBACK_URL=http://localhost:3000/api/pesapal/callback

# For Sandbox/Test Mode (recommended for localhost)
PESAPAL_SANDBOX=true

# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# JWT Secret
JWT_SECRET=your-secret-key-here-min-32-chars

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth (if using Google sign-in)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## How to Check

1. **Navigate to the web directory:**
   ```bash
   cd web
   ```

2. **Check if .env exists:**
   ```bash
   # Windows PowerShell
   Test-Path .env
   
   # Or just try to open it
   notepad .env
   ```

3. **Verify Pesapal credentials are set:**
   - `PESAPAL_CONSUMER_KEY` should have your consumer key
   - `PESAPAL_CONSUMER_SECRET` should have your consumer secret
   - `PESAPAL_CALLBACK_URL` should be set (auto-derived IPN URL)

## Common Issues

### Issue: ".env not found"
**Solution:** Create the file (`.env` or `.env.local`) in the `web` directory with the variables above.

### Issue: "Pesapal credentials not configured"
**Solution:** Make sure `PESAPAL_CONSUMER_KEY` and `PESAPAL_CONSUMER_SECRET` are set in your `.env` file.

### Issue: "Unauthorized" error
**Possible causes:**
1. Missing Pesapal credentials in `.env.local`
2. Session expired (try signing out and signing in again)
3. Booking doesn't belong to current user

**Solution:** 
- Check your `.env.local` file has all required variables
- Restart your Next.js server after adding/updating `.env.local`
- Try signing out and signing in again

## After Updating .env

**IMPORTANT:** Always restart your Next.js server after updating `.env` or `.env.local`:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

Environment variables are only loaded when the server starts!
