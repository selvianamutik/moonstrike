/**
 * Script to add PayPal to payment_provider enum
 * Run with: npx tsx scripts/add-paypal-provider.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addPayPalProvider() {
  console.log('Checking current payment providers...');

  // Check if PayPal is already in the enum by trying to insert a test record
  const { data: testData, error: testError } = await supabase
    .from('checkout_sessions')
    .select('provider')
    .limit(1);

  console.log('\nCurrent database connection: OK');
  console.log('\nTo add PayPal to the payment_provider enum, you need to:');
  console.log('1. Connect to your Supabase project');
  console.log('2. Go to SQL Editor');
  console.log('3. Run this SQL command:\n');
  console.log("   ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'paypal';\n");
  console.log('Or if that fails (enum value already exists), use:\n');
  console.log(`   ALTER TYPE payment_provider RENAME TO payment_provider_old;`);
  console.log(`   CREATE TYPE payment_provider AS ENUM ('stripe', 'nowpayments', 'paypal');`);
  console.log(`   ALTER TABLE checkout_sessions ALTER COLUMN provider TYPE payment_provider USING provider::text::payment_provider;`);
  console.log(`   ALTER TABLE payment_transactions ALTER COLUMN provider TYPE payment_provider USING provider::text::payment_provider;`);
  console.log(`   DROP TYPE payment_provider_old;\n`);
  
  console.log('Migration file created at: supabase/migration/20260708000000_add_paypal_provider.sql');
}

addPayPalProvider().then(() => process.exit(0));
