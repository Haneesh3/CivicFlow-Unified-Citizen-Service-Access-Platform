const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@civicflow.gov.in' },
    update: {},
    create: {
      email: 'admin@civicflow.gov.in',
      phone: '9999999999',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      city: 'Delhi',
    },
  });

  // Demo Services
  const services = [
    {
      title: 'Aadhaar Services',
      description: 'Download e-Aadhaar, check update status, and manage UIDAI services.',
      category: 'Identity',
      ministry: 'UIDAI',
      tags: 'aadhaar, identity, uidai',
      integrationType: 'DEEPLINK',
      applyUrl: 'https://myaadhaar.uidai.gov.in/',
    },
    {
      title: 'PAN Card Services',
      description: 'Apply for a new PAN, check status, or link with Aadhaar.',
      category: 'Finance',
      ministry: 'Income Tax Dept',
      tags: 'pan, finance, tax',
      integrationType: 'DEEPLINK',
      applyUrl: 'https://www.pan.utiitsl.com/',
    },
    {
      title: 'Passport Seva',
      description: 'Schedule an appointment and track passport applications.',
      category: 'Travel',
      ministry: 'MEA',
      tags: 'passport, travel',
      integrationType: 'WEBVIEW',
      applyUrl: 'https://portal2.passportindia.gov.in/',
    }
  ];

  for (const s of services) {
    await prisma.service.create({
      data: s
    });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
