const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
(async () => {
  const email = 'admin@civicflow.gov.in';
  const password = 'Admin@123456';
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    console.log('ADMIN_EXISTS');
    console.log(existing.email);
    console.log(existing.role);
  } else {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name: 'System Admin', role: 'ADMIN' },
    });
    console.log('ADMIN_CREATED');
    console.log(JSON.stringify({ email, password, id: user.id }));
  }
  await prisma.$disconnect();
})().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
