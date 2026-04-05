const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');

async function seed() {
  const email = process.env.ADMIN_EMAIL || 'admin@eduplatform.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const hash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, role: 'ADMIN', name: 'Admin', passwordHash: hash },
  });

  console.log(`✅ Admin seeded: ${admin.email}`);
  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
