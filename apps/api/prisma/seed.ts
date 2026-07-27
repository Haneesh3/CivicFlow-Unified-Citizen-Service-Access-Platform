import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting smart seed...');

  const services = [
    {
      title: 'Aadhaar Services',
      description: 'Update identity data at the nearest enrollment center.',
      category: 'IDENTITY',
      ministry: 'UIDAI',
      integrationType: 'DIRECT',
    },
    {
      title: 'Voter ID (EPIC)',
      description: 'Apply for new Voter ID or request changes.',
      category: 'IDENTITY',
      ministry: 'Election Commission',
      integrationType: 'DIRECT',
    },
    {
      title: 'Passport Seva',
      description: 'Apply for fresh passport or renewal.',
      category: 'IDENTITY',
      ministry: 'MEA',
      integrationType: 'DIRECT',
    },
    {
      title: 'Birth Certificate',
      description: 'Register new birth or get a duplicate.',
      category: 'CERTIFICATES',
      ministry: 'MCD',
      integrationType: 'DIRECT',
    },
    {
      title: 'Income Certificate',
      description: 'Proof of annual income for schemes.',
      category: 'CERTIFICATES',
      ministry: 'Revenue Dept',
      integrationType: 'DIRECT',
    },
    {
      title: 'Driving License',
      description: 'Apply for Learner or Permanent DL.',
      category: 'TRANSPORT',
      ministry: 'Transport Dept',
      integrationType: 'DIRECT',
    },
    {
      title: 'Property Tax',
      description: 'Pay taxes or apply for property mutation.',
      category: 'PROPERTY',
      ministry: 'MCD',
      integrationType: 'DIRECT',
    },
    {
      title: 'Water Connection',
      description: 'New tap connection or billing.',
      category: 'UTILITIES',
      ministry: 'DJB',
      integrationType: 'DIRECT',
    },
    {
      title: 'ABHA Health Card',
      description: 'Create Ayushman Bharat Health Account to securely manage medical records.',
      category: 'HEALTHCARE',
      ministry: 'National Health Authority',
      integrationType: 'DIRECT',
    },
    {
      title: 'Vaccine & Clinic Booking',
      description: 'Book vaccination slots and view nearby municipal wellness centers.',
      category: 'HEALTHCARE',
      ministry: 'Ministry of Health',
      integrationType: 'DIRECT',
    },
    {
      title: 'PMAY Housing Scheme',
      description: 'Apply for central housing subsidy benefits under Pradhan Mantri Awas Yojana.',
      category: 'WELFARE',
      ministry: 'MoHUA',
      integrationType: 'DIRECT',
    },
    {
      title: 'Senior Citizen Pension',
      description: 'Submit application or verify status for monthly state pension benefits.',
      category: 'WELFARE',
      ministry: 'Social Welfare Dept',
      integrationType: 'DIRECT',
    },
    {
      title: 'Udyam MSME Registration',
      description: 'Register your micro, small or medium enterprise for government benefits.',
      category: 'DIGITAL GOVERNANCE',
      ministry: 'Ministry of MSME',
      integrationType: 'DIRECT',
    },
    {
      title: 'Shop & Establishment License',
      description: 'Register local commercial shops and business establishments with the corporation.',
      category: 'BUSINESS',
      ministry: 'Municipal Corporation',
      integrationType: 'DIRECT',
    },
    {
      title: 'DigiLocker Services',
      description: 'Access and share authentic digital documents instantly in the cloud.',
      category: 'DIGITAL GOVERNANCE',
      ministry: 'MeitY',
      integrationType: 'DIRECT',
    },
    {
      title: 'Cyber Crime Desk',
      description: 'Report financial frauds, identity thefts, or online harassment online.',
      category: 'DIGITAL GOVERNANCE',
      ministry: 'MHA',
      integrationType: 'DIRECT',
    },
    {
      title: 'MyGov Engagement',
      description: 'Participate in policymaking, survey polls, and citizen discussions.',
      category: 'DIGITAL GOVERNANCE',
      ministry: 'MeitY',
      integrationType: 'DIRECT',
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { title: service.title },
      update: {
        description: service.description,
        category: service.category,
        ministry: service.ministry,
        integrationType: service.integrationType,
      },
      create: service,
    });
  }

  console.log('Smart seed completed! Data is now permanent and safe.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
