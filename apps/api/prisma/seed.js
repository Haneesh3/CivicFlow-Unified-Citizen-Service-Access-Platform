const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Starting seed via Supabase API with manual IDs...');

  // 1. Services Data
  const services = [
    {
      id: uuidv4(),
      title: 'Aadhaar Services',
      description: 'Update identity data at the nearest enrollment center.',
      category: 'IDENTITY',
      ministry: 'UIDAI',
      integrationType: 'DIRECT',
    },
    {
      id: uuidv4(),
      title: 'Voter ID (EPIC)',
      description: 'Apply for new Voter ID or request changes.',
      category: 'IDENTITY',
      ministry: 'Election Commission',
      integrationType: 'DIRECT',
    },
    {
      id: uuidv4(),
      title: 'Passport Seva',
      description: 'Apply for fresh passport or renewal.',
      category: 'IDENTITY',
      ministry: 'MEA',
      integrationType: 'DIRECT',
    },
    {
      id: uuidv4(),
      title: 'Birth Certificate',
      description: 'Register new birth or get a duplicate.',
      category: 'CERTIFICATES',
      ministry: 'MCD',
      integrationType: 'DIRECT',
    },
    {
      id: uuidv4(),
      title: 'Income Certificate',
      description: 'Proof of annual income for schemes.',
      category: 'CERTIFICATES',
      ministry: 'Revenue Dept',
      integrationType: 'DIRECT',
    },
    {
      id: uuidv4(),
      title: 'Driving License',
      description: 'Apply for Learner or Permanent DL.',
      category: 'TRANSPORT',
      ministry: 'Transport Dept',
      integrationType: 'DIRECT',
    },
    {
      id: uuidv4(),
      title: 'Property Tax',
      description: 'Pay taxes or apply for property mutation.',
      category: 'PROPERTY',
      ministry: 'MCD',
      integrationType: 'DIRECT',
    },
    {
      id: uuidv4(),
      title: 'Water Connection',
      description: 'New tap connection or billing.',
      category: 'UTILITIES',
      ministry: 'DJB',
      integrationType: 'DIRECT',
    },
  ];

  console.log('Cleaning existing services...');
  await supabase.from('Service').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Inserting fresh services...');
  const { error: insertError } = await supabase.from('Service').insert(services);

  if (insertError) {
    console.error('Error inserting services:', insertError);
    return;
  }

  console.log('Seed completed successfully with manual IDs!');
}

main();
