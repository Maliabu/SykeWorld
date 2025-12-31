/**
 * Helper script to retrieve IPN IDs from Pesapal
 * 
 * Usage:
 * 1. Make sure your .env.local has PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET
 * 2. Run: npx tsx scripts/get-ipn-id.ts
 * 
 * This will list all registered IPN URLs and their associated IDs
 */

import { getPesapalIpnIds, registerPesapalIpn } from "../lib/actions/pesapal";

async function main() {
  console.log("🔍 Fetching registered IPN URLs from Pesapal...\n");

  const result = await getPesapalIpnIds();

  if (result.error) {
    console.error("❌ Error:", result.error);
    console.log("\n💡 Tip: Make sure PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET are set in .env.local");
    process.exit(1);
  }

  if (result.ipnList && Array.isArray(result.ipnList) && result.ipnList.length > 0) {
    console.log("✅ Found", result.ipnList.length, "registered IPN URL(s):\n");
    result.ipnList.forEach((ipn: any, index: number) => {
      console.log(`${index + 1}. IPN URL: ${ipn.url || ipn.ipn_url}`);
      console.log(`   IPN ID: ${ipn.ipn_id || ipn.id || "Not found in response"}`);
      console.log(`   Type: ${ipn.ipn_notification_type || "N/A"}`);
      console.log("");
    });
    console.log("📋 Copy the IPN ID above and add it to your .env.local:");
    console.log("   PESAPAL_IPN_ID=your-ipn-id-here\n");
  } else {
    console.log("⚠️  No IPN URLs found. You can register one:\n");
    console.log("   Option 1: Use the Pesapal dashboard");
    console.log("   Option 2: Use registerPesapalIpn() function\n");
    
    // Example of how to register (commented out)
    console.log("   Example registration code:");
    console.log('   const result = await registerPesapalIpn("https://sykeworld.com/api/pesapal/ipn", "POST");');
    console.log('   console.log("IPN ID:", result.ipnId);\n');
  }
}

main().catch(console.error);


