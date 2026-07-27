import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Adding detailed tracking history to Local DB...');

  // 1. Get existing applications
  const apps = await prisma.serviceApplication.findMany();
  
  if (apps.length === 0) {
    console.log('No applications found. Please book a service in the app first.');
    return;
  }

  // 2. Clear old updates
  await prisma.serviceApplicationUpdate.deleteMany();

  for (const app of apps) {
    // Add "Submitted" step
    await prisma.serviceApplicationUpdate.create({
      data: {
        applicationId: app.id,
        status: 'SUBMITTED',
        message: 'Application submitted successfully. Reference ID generated.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    });

    // Add "Under Review" step
    await prisma.serviceApplicationUpdate.create({
      data: {
        applicationId: app.id,
        status: 'UNDER_REVIEW',
        message: 'Documents verified by the service center. Background check initiated.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    });

    // Add Final step
    await prisma.serviceApplicationUpdate.create({
      data: {
        applicationId: app.id,
        status: 'COMPLETED',
        message: 'Aadhaar name updated successfully. Your digital Aadhaar is ready for download on the UIDAI portal.',
        createdAt: new Date()
      }
    });
    
    // Update the app status to COMPLETED
    await prisma.serviceApplication.update({
      where: { id: app.id },
      data: { status: 'COMPLETED' }
    });
  }

  console.log('Detailed tracking history added successfully to Local DB!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
