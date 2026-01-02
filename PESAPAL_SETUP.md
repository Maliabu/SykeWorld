# Pesapal Payment Configuration Guide

This guide explains how to configure Pesapal payment credentials for the Syke World Hotel booking system.

## Required Environment Variables

You need to configure the following environment variables in your `.env` or `.env.local` file:

```env
# Pesapal Payment Gateway Configuration
PESAPAL_CONSUMER_KEY=your-consumer-key-here
PESAPAL_CONSUMER_SECRET=your-consumer-secret-here
PESAPAL_CALLBACK_URL=https://yourdomain.com/api/pesapal/callback
PESAPAL_BASE_URL=https://pay.pesapal.com/v3

# Sandbox/Test Mode (for localhost development)
# Set to "true" to use sandbox/test environment (no real payments)
# PESAPAL_SANDBOX=true

# IPN (Instant Payment Notification) Configuration
# 
# AUTOMATIC IPN HANDLING (No manual configuration needed):
# The system automatically handles IPN registration following Pesapal's API flow:
# 1. Authenticates with consumer keys to get token
# 2. Checks for existing registered IPN URLs
# 3. If not found, automatically registers the IPN URL
# 4. Gets the IPN ID and uses it in payment requests
#
# The IPN URL is automatically derived from your callback URL:
# - If callback is: https://yourdomain.com/api/pesapal/callback
# - IPN URL will be: https://yourdomain.com/api/pesapal/ipn
#
# You can optionally set a custom IPN URL if needed:
# PESAPAL_IPN_URL=https://yourdomain.com/api/pesapal/ipn
#
# ⚠️ NOTE: You do NOT need to manually set PESAPAL_IPN_ID - the system handles this automatically!
#
# HOW TO GET YOUR IPN ID (if you want to set it manually):
#
# Option 1: Via Pesapal API (Recommended)
# 1. Use the helper script: npx tsx scripts/get-ipn-id.ts
# 2. Or use: getPesapalIpnIds() from lib/actions/pesapal.ts
# 3. Find your IPN URL in the response and copy its associated ID
#
# Option 2: Register via API and get ID immediately
# 1. Use registerPesapalIpn("https://sykeworld.com/api/pesapal/ipn", "POST")
# 2. The response will include the IPN ID
# 3. Copy that ID to your .env.local
#
# Example of CORRECT format:
# PESAPAL_IPN_ID=ipn-12345678-abcd-efgh-ijkl-123456789abc
#
# Example of INCORRECT format (DO NOT USE):
# PESAPAL_IPN_ID=https://sykeworld.com/api/pesapal/ipn  ❌
# PESAPAL_IPN_ID=http://localhost:3000/api/pesapal/ipn  ❌
#
# IMPORTANT: If you don't want to use IPN:
# - DO NOT add PESAPAL_IPN_ID or PESAPAL_IPN_URL, OR
# - Leave it commented out (with #)
# - The payment will still work, you just won't receive IPN notifications
```

## Step-by-Step Setup

### 1. Create or Edit `.env` File

Create a file named `.env` (or `.env.local`) in the `web` directory (same level as `package.json`).

**Location:** `web/.env` or `web/.env.local`

**Note:** The code supports both `.env` and `.env.local` files. Use whichever you prefer.

### 2. Get Your Pesapal Credentials

1. **Sign up for Pesapal** (if you haven't already):
   - Go to [https://www.pesapal.com](https://www.pesapal.com)
   - Register for a merchant account
   - Complete the verification process

2. **Get your Consumer Key and Secret**:
   - Log in to your Pesapal merchant dashboard
   - Navigate to **Settings** → **API Credentials** or **Developer** section
   - Copy your **Consumer Key** and **Consumer Secret**
   - **Note:** Use **Sandbox credentials** for testing, **Production credentials** for live payments

3. **For Test/Sandbox Mode** (Recommended for localhost):
   - Visit [https://developer.pesapal.com](https://developer.pesapal.com) or [http://demo.pesapal.com](http://demo.pesapal.com)
   - Register for a test/developer account
   - Get test credentials (different from production)
   - Your test account will have a virtual balance (e.g., 1000 KES) for testing
   - See [PESAPAL_SANDBOX_SETUP.md](./PESAPAL_SANDBOX_SETUP.md) for detailed sandbox setup

### 3. Set Up Callback URL

The callback URL is where Pesapal will redirect users after payment. It should be:

```
https://yourdomain.com/api/pesapal/callback
```

**For local development**, you can use:
```
http://localhost:3000/api/pesapal/callback
```

**Important:** 
- Make sure this URL is accessible from the internet (Pesapal needs to reach it)
- For local development, you may need to use a tunneling service like ngrok
- The callback URL must be registered in your Pesapal dashboard

### 4. Add Environment Variables

Open `web/.env` (or `web/.env.local`) and add:

```env
# Pesapal Configuration
PESAPAL_CONSUMER_KEY=qkio1BGGYgTumCPtkF-s3HTFrKjKbO5v
PESAPAL_CONSUMER_SECRET=your-secret-key-here
PESAPAL_CALLBACK_URL=https://sykeworld.com/api/pesapal/callback
PESAPAL_BASE_URL=https://pay.pesapal.com/v3
```

**Replace:**
- `your-consumer-key-here` with your actual Consumer Key
- `your-secret-key-here` with your actual Consumer Secret
- `https://sykeworld.com/api/pesapal/callback` with your actual callback URL

### 5. Environment-Specific Configuration

#### For Development (Local):
```env
PESAPAL_BASE_URL=https://pay.pesapal.com/v3
PESAPAL_CALLBACK_URL=http://localhost:3000/api/pesapal/callback
```

#### For Production:
```env
PESAPAL_BASE_URL=https://pay.pesapal.com/v3
PESAPAL_CALLBACK_URL=https://sykeworld.com/api/pesapal/callback
```

### 6. Restart Your Development Server

After adding the environment variables:

1. **Stop your Next.js server** (Ctrl+C)
2. **Restart it** with:
   ```bash
   npm run dev
   ```

Environment variables are loaded when the server starts, so you must restart for changes to take effect.

## Verification

To verify your configuration is working:

1. Check that the error "Pesapal credentials not configured" is gone
2. Try making a test booking
3. Check the browser console for any Pesapal-related errors
4. Check your server logs for detailed error messages

## Troubleshooting

### Error: "Pesapal credentials not configured"
- **Solution:** Make sure `.env` or `.env.local` exists in the `web` directory
- **Solution:** Verify the variable names are exactly: `PESAPAL_CONSUMER_KEY` and `PESAPAL_CONSUMER_SECRET`
- **Solution:** Restart your development server after adding variables

### Error: "Failed to get Pesapal token"
- **Solution:** Verify your Consumer Key and Secret are correct
- **Solution:** Check if you're using Sandbox credentials in Sandbox mode
- **Solution:** Ensure your Pesapal account is active and verified

### Error: "Payment callback not configured"
- **Solution:** Add `PESAPAL_CALLBACK_URL` to your `.env.local`
- **Solution:** Make sure the callback URL is accessible from the internet
- **Solution:** Register the callback URL in your Pesapal dashboard

### Payment redirect not working
- **Solution:** Verify the callback URL is correct and accessible
- **Solution:** Check that the callback route exists: `/api/pesapal/callback`
- **Solution:** Ensure your domain is whitelisted in Pesapal (if required)

### Error: "Invalid IPN URL ID provided" or "Invalid IPN URL ID provided.Check format and try again"
- **Common Cause:** You're using the IPN URL instead of the IPN ID in `PESAPAL_IPN_ID`
- **Solution:** `PESAPAL_IPN_ID` must be the **ID** that Pesapal assigns, NOT the URL
- **How to Fix:**
  1. Log in to your Pesapal dashboard
  2. Go to Settings → IPN/Notifications (or Developer → IPN Settings)
  3. Find your registered IPN URL
  4. Look for the **IPN ID** next to your URL (it's usually a UUID or alphanumeric string like `ipn-12345678-abcd-efgh`)
  5. Copy **ONLY the ID**, not the URL
  6. Update `.env.local`: `PESAPAL_IPN_ID=ipn-12345678-abcd-efgh` (use your actual ID)
  7. Restart your server

- **Example of CORRECT format:**
  ```env
  PESAPAL_IPN_ID=ipn-12345678-abcd-efgh-ijkl-123456789abc
  ```

- **Example of INCORRECT format (DO NOT USE):**
  ```env
  PESAPAL_IPN_ID=https://sykeworld.com/api/pesapal/ipn  ❌
  PESAPAL_IPN_ID=http://localhost:3000/api/pesapal/ipn  ❌
  ```

- **If you don't want to use IPN:**
  - Remove `PESAPAL_IPN_ID` from your `.env.local` file completely
  - Remove all IPN URLs from your Pesapal dashboard

### How to Get Your IPN ID (If You Only See URL Listeners)

If your Pesapal dashboard only shows "URL listeners" without IDs, you can retrieve the IPN IDs using the API:

**Option 1: Use the Helper Script (Easiest)**

1. Make sure your `.env.local` has `PESAPAL_CONSUMER_KEY` and `PESAPAL_CONSUMER_SECRET`
2. Run the helper script:
   ```bash
   npx tsx scripts/get-ipn-id.ts
   ```
3. The script will list all your registered IPN URLs and their IDs
4. Copy the IPN ID and add it to `.env.local`: `PESAPAL_IPN_ID=your-ipn-id-here`

**Option 2: Use the Helper Functions in Code**

You can also use the helper functions directly:

```typescript
import { getPesapalIpnIds, registerPesapalIpn } from "@/lib/actions/pesapal";

// Get all registered IPN URLs and their IDs
const result = await getPesapalIpnIds();
console.log(result.ipnList); // Shows all IPN URLs with their IDs

// Or register a new IPN URL and get its ID immediately
const registerResult = await registerPesapalIpn("https://sykeworld.com/api/pesapal/ipn", "POST");
console.log(registerResult.ipnId); // This is what you need for PESAPAL_IPN_ID
```

**Option 3: Use Pesapal API Directly**

You can also call Pesapal's API directly using curl or Postman:

```bash
# First, get an access token
curl -X POST "https://pay.pesapal.com/v3/api/Auth/RequestToken" \
  -H "Content-Type: application/json" \
  -d '{
    "consumer_key": "YOUR_CONSUMER_KEY",
    "consumer_secret": "YOUR_CONSUMER_SECRET"
  }'

# Then get IPN list (replace YOUR_ACCESS_TOKEN with the token from above)
curl -X GET "https://pay.pesapal.com/v3/api/URLSetup/GetIpnList" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Accept: application/json"
```

The response will include your IPN URLs with their associated IDs.

## Security Notes

⚠️ **Important Security Reminders:**

1. **Never commit `.env` or `.env.local` to Git** - They should be in `.gitignore`
2. **Use different credentials for development and production**
3. **Keep your Consumer Secret secure** - Don't share it publicly
4. **Rotate credentials** if they're ever exposed
5. **Use environment variables** in production hosting (Vercel, Render, etc.)

## Production Deployment

When deploying to production (Vercel, Render, etc.):

1. Add the environment variables in your hosting platform's dashboard
2. Use production Pesapal credentials (not sandbox)
3. Update the callback URL to your production domain
4. Test the payment flow thoroughly before going live

## Need Help?

If you're still having issues:
1. Check the browser console for detailed error messages
2. Check server logs for Pesapal API responses
3. Verify your Pesapal account status
4. Contact Pesapal support if credentials are invalid

