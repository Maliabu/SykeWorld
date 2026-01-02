# Pesapal Sandbox/Test Mode Setup Guide

This guide explains how to configure Pesapal in **sandbox/test mode** for local development, so you can test payments without using real money.

## Why Use Sandbox Mode?

- **No real money**: Test payments don't deduct from your real account balance
- **Safe testing**: Test all payment scenarios without financial risk
- **Test account balance**: Use your test account's 1000 KES balance for testing
- **Development**: Perfect for localhost development

## Step 1: Get Your Sandbox Credentials

1. **Visit Pesapal Developer Portal**:
   - Go to [https://developer.pesapal.com](https://developer.pesapal.com)
   - Or visit [http://demo.pesapal.com](http://demo.pesapal.com) for test account registration

2. **Register for a Test Account**:
   - Sign up for a developer/test merchant account
   - Complete the registration process

3. **Get Your Test Credentials**:
   - After registration, you'll receive an email with:
     - **Consumer Key** (test)
     - **Consumer Secret** (test)
   - If you don't receive the email:
     - Log in to your Pesapal dashboard
     - Go to **Settings** → **API Credentials**
     - Click **"RESEND"** to have credentials sent to your email

4. **Note Your Test Account Balance**:
   - Your test account should have a balance (e.g., 1000 KES)
   - This is virtual money for testing only

## Step 2: Configure Your `.env` File

Open `web/.env` (or `web/.env.local`) and add/update these variables:

### For Sandbox/Test Mode (Localhost):

```env
# Enable Sandbox Mode
PESAPAL_SANDBOX=true

# Use your TEST credentials (from sandbox account)
PESAPAL_CONSUMER_KEY=your-test-consumer-key-here
PESAPAL_CONSUMER_SECRET=your-test-consumer-secret-here

# Sandbox Base URL (automatically used when PESAPAL_SANDBOX=true)
# You can also set it manually:
# PESAPAL_BASE_URL=https://cybqa.pesapal.com/pesapalv3

# Callback URL for localhost (you may need ngrok for this)
PESAPAL_CALLBACK_URL=http://localhost:3000/api/pesapal/callback

# Optional: IPN URL for localhost
PESAPAL_IPN_URL=http://localhost:3000/api/pesapal/ipn
```

### For Production Mode:

```env
# Disable Sandbox Mode
PESAPAL_SANDBOX=false

# Use your PRODUCTION credentials
PESAPAL_CONSUMER_KEY=your-production-consumer-key-here
PESAPAL_CONSUMER_SECRET=your-production-consumer-secret-here

# Production Base URL
PESAPAL_BASE_URL=https://pay.pesapal.com/v3

# Production Callback URL
PESAPAL_CALLBACK_URL=https://yourdomain.com/api/pesapal/callback
```

## Step 3: Set Up Callback URL for Localhost

Pesapal needs to send callbacks to your local server. For localhost, you have two options:

### Option A: Use ngrok (Recommended for Testing)

1. **Install ngrok**:
   ```bash
   # Download from https://ngrok.com/download
   # Or use npm: npm install -g ngrok
   ```

2. **Start your Next.js server**:
   ```bash
   cd web
   npm run dev
   ```

3. **In another terminal, start ngrok**:
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Update `.env.local`**:
   ```env
   PESAPAL_CALLBACK_URL=https://abc123.ngrok.io/api/pesapal/callback
   PESAPAL_IPN_URL=https://abc123.ngrok.io/api/pesapal/ipn
   ```

6. **Register the URL in Pesapal Dashboard**:
   - Log in to your Pesapal test account dashboard
   - Go to **Settings** → **IPN Settings** or **Callback URLs**
   - Add your ngrok URL

### Option B: Use Localhost (May Not Work for IPN)

If you just want to test the payment flow without IPN:
```env
PESAPAL_CALLBACK_URL=http://localhost:3000/api/pesapal/callback
```

**Note**: IPN (Instant Payment Notifications) may not work with localhost, but the callback should work for basic testing.

## Step 4: Restart Your Server

After updating `.env.local`:

1. **Stop your server** (Ctrl+C)
2. **Restart it**:
   ```bash
   npm run dev
   ```

## Step 5: Verify Sandbox Mode is Active

The system will automatically use sandbox mode when:
- `PESAPAL_SANDBOX=true` is set, OR
- `NODE_ENV=development` (default in local development)

You can verify by checking the console logs when making a payment. The base URL should point to the sandbox endpoint.

## Testing Payments

### Test Payment Methods

Pesapal sandbox provides test payment methods:

1. **Test Cards** (if card payments are enabled):
   - **Where to find test cards**: Test card numbers are typically displayed **below the card number field** on the Pesapal payment form when you're in sandbox mode
   - When you reach the Pesapal payment page, look for test card information displayed on the page itself
   - You can also check your Pesapal test account dashboard for test card details
   - **Common test card format**:
     - Card Number: Usually shown on the payment form (e.g., `4111111111111111` or similar)
     - CVV: Any 3-digit number (e.g., `123`)
     - Expiry Date: Any future date (e.g., `12/25` or `12/2025`)
   - **Note**: If you don't see test card numbers on the payment form, contact Pesapal support or check your test account dashboard

2. **Mobile Money** (MTN, Airtel, etc.):
   - Use test phone numbers provided in your Pesapal test account
   - Payments will be simulated without real money
   - Check your Pesapal dashboard for test mobile money numbers

3. **Test Account Balance**:
   - Your test account has a virtual balance (e.g., 1000 KES)
   - This is used for testing, not real money
   - The balance is reset or replenished by Pesapal for testing purposes

### Making a Test Payment

1. Go to your booking page: `http://localhost:3000/booking`
2. Complete the booking form
3. Click "Confirm & Pay"
4. You'll be redirected to Pesapal sandbox payment page
5. **Look for test card information on the payment page** - Pesapal usually displays test card numbers below the card input field
6. Use the test card numbers shown on the page (or from your dashboard)
7. Enter any CVV (e.g., `123`) and future expiry date (e.g., `12/2025`)
8. Complete the payment
9. You'll be redirected back to your callback URL

### Where to Find Test Cards

**Option 1: On the Payment Form (Easiest)**
- When you're redirected to Pesapal's payment page in sandbox mode
- Look **below the card number input field** - test card numbers are usually displayed there
- This is the most common place to find them

**Option 2: Pesapal Test Account Dashboard**
- Log in to your Pesapal test account at [demo.pesapal.com](http://demo.pesapal.com) or your test dashboard
- Navigate to **Settings** → **Test Cards** or **Developer** → **Test Credentials**
- Test card information should be listed there

**Option 3: Contact Pesapal Support**
- If you can't find test cards in either location
- Contact Pesapal support through your test account dashboard
- They can provide you with the test card numbers for your sandbox environment

**Note**: Test card numbers may vary depending on your test account setup. Always use the numbers provided by Pesapal for your specific test account.

## Troubleshooting

### Issue: "Pesapal credentials not configured"
- **Solution**: Make sure `.env` or `.env.local` has `PESAPAL_CONSUMER_KEY` and `PESAPAL_CONSUMER_SECRET`
- **Solution**: Restart your server after adding variables

### Issue: "Failed to get Pesapal token"
- **Solution**: Verify you're using **test credentials** (not production)
- **Solution**: Check that your test account is active
- **Solution**: Make sure `PESAPAL_SANDBOX=true` is set

### Issue: Callback not working
- **Solution**: Use ngrok to expose localhost to the internet
- **Solution**: Register the ngrok URL in Pesapal dashboard
- **Solution**: Make sure the callback URL in `.env.local` matches the registered URL

### Issue: Still making real payments
- **Solution**: Double-check `PESAPAL_SANDBOX=true` in `.env.local`
- **Solution**: Verify you're using test credentials (different from production)
- **Solution**: Check server logs to see which base URL is being used

### Issue: IPN not working
- **Solution**: IPN requires a publicly accessible URL (use ngrok)
- **Solution**: Register the IPN URL in Pesapal dashboard
- **Solution**: Check server logs for IPN requests

## Switching Between Sandbox and Production

### For Local Development:
```env
PESAPAL_SANDBOX=true
# Use test credentials
```

### For Production Deployment:
```env
PESAPAL_SANDBOX=false
# Use production credentials
PESAPAL_BASE_URL=https://pay.pesapal.com/v3
```

## Important Notes

⚠️ **Security Reminders**:
- Never commit `.env.local` to Git (it's already in `.gitignore`)
- Use different credentials for test and production
- Test thoroughly in sandbox before going live
- Always verify you're in sandbox mode when testing locally

⚠️ **Before Going Live**:
- Switch `PESAPAL_SANDBOX=false`
- Update to production credentials
- Update callback URLs to production domain
- Test payment flow one more time

## Need Help?

If you're still having issues:
1. Check server logs for detailed error messages
2. Verify your test account status in Pesapal dashboard
3. Contact Pesapal support for test account issues
4. Check the main [PESAPAL_SETUP.md](./PESAPAL_SETUP.md) for more details
