const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Adding sample civic issues...');

  // 1. Find a user to assign complaints to
  const { data: users, error: userError } = await supabase.from('User').select('id').limit(1);
  
  if (userError || !users || users.length === 0) {
    console.log('No users found. Please register in the app first to see sample issues on your dashboard.');
    return;
  }

  const userId = users[0].id;

  // 2. Sample Complaints
  const complaints = [
    {
      id: uuidv4(),
      title: 'Large Pothole near Gandhi Nagar',
      description: 'Major pothole causing traffic issues near the main market area.',
      category: 'Road / Pothole',
      status: 'SUBMITTED',
      userId: userId,
      address: 'Gandhi Nagar Main Road, Delhi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      title: 'Uncollected Garbage',
      description: 'Garbage has not been collected for the last 3 days in this lane.',
      category: 'Garbage',
      status: 'IN_PROGRESS',
      userId: userId,
      address: 'Street 4, Sector 12, Dwarka',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  console.log('Inserting sample complaints...');
  const { error: complaintError } = await supabase.from('Complaint').insert(complaints);

  if (complaintError) {
    console.error('Error inserting complaints:', complaintError);
    return;
  }

  console.log('Sample civic issues added successfully!');
}

main();
