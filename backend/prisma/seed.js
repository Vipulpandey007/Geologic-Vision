/**
 * Prisma seed script - creates default admin user
 * Run: npx prisma db seed
 * Or:  node prisma/seed.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@eduplatform.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = 'Platform Admin';

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: adminName },
    create: {
      email: adminEmail,
      name: adminName,
      role: 'ADMIN',
      passwordHash,
    },
  });

  console.log(`✅ Admin user seeded: ${admin.email}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   ID: ${admin.id}`);

  // Seed a sample free course
  const course = await prisma.course.upsert({
    where: { id: 'sample-course-001' },
    update: {},
    create: {
      id: 'sample-course-001',
      title: 'Introduction to Web Development',
      description: 'Learn the fundamentals of HTML, CSS, and JavaScript with hands-on projects.',
      price: 0,
      isFree: true,
      isPublished: true,
    },
  });

  const chapter1 = await prisma.chapter.upsert({
    where: { id: 'sample-ch-001' },
    update: {},
    create: {
      id: 'sample-ch-001',
      courseId: course.id,
      title: 'Chapter 1: HTML Foundations',
      description: 'Tags, structure, and semantics',
      order: 1,
    },
  });

  const chapter2 = await prisma.chapter.upsert({
    where: { id: 'sample-ch-002' },
    update: {},
    create: {
      id: 'sample-ch-002',
      courseId: course.id,
      title: 'Chapter 2: CSS Styling',
      description: 'Selectors, box model, flexbox',
      order: 2,
    },
  });

  console.log(`✅ Sample course seeded: ${course.title}`);
  console.log(`   Chapters: ${chapter1.title}, ${chapter2.title}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
