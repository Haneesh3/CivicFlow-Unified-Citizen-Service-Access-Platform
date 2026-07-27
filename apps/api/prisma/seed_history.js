const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Adding detailed tracking history...');

  // 1. Get existing applications
  const { data: apps, error: appError } = await supabase.from('ServiceApplication').select('id, status');
  
  if (appError || !apps || apps.length === 0) {
    console.log('No applications found to update.');
    return;
  }

  const updates = [];

  for (const app of apps) {
    // Add "Submitted" step for everyone
    updates.push({
      id: uuidv4(),
      applicationId: app.id,
      status: 'SUBMITTED',
      message: 'Application submitted successfully. Reference ID generated.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    });

    // Add "Under Review" step
    updates.push({
      id: uuidv4(),
      applicationId: app.id,
      status: 'UNDER_REVIEW',
      message: 'Documents verified by the service center. Background check initiated.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    });

    // If it's a mock Aadhaar update, add final steps
    updates.push({
      id: uuidv4(),
      applicationId: app.id,
      status: 'COMPLETED',
      message: 'Aadhaar name updated successfully. Your digital Aadhaar is ready for download on the UIDAI portal.',
      createdAt: new Date().toISOString()
    });
  }

  console.log(`Inserting ${updates.length} tracking updates...`);
  const { error: insertError } = await supabase.from('ServiceApplicationUpdate').insert(updates);

  if (insertError) {
    console.error('Error inserting updates:', insertError);
    return;
  }

  console.log('Detailed tracking history added successfully!');
}

main();
