/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// All sample users share this password for easy testing
const DEFAULT_PASSWORD = 'password123';

const sampleUsers = [
  // Admin
  { name: 'Admin User', email: 'admin@ims.com', role: 'ADMIN', department: null, password: 'admin123' },

  // Media department
  { name: 'Maria Mediamanager', email: 'media.manager@ims.com', role: 'MANAGER', department: 'MEDIA' },
  { name: 'Mike Editor', email: 'media.employee@ims.com', role: 'EMPLOYEE', department: 'MEDIA' },

  // Evangelism department
  { name: 'Evan Evangelist', email: 'evangelism.manager@ims.com', role: 'MANAGER', department: 'EVANGELISM' },
  { name: 'Eve Outreach', email: 'evangelism.employee@ims.com', role: 'EMPLOYEE', department: 'EVANGELISM' },

  // IT department
  { name: 'Ivan ITlead', email: 'it.manager@ims.com', role: 'MANAGER', department: 'IT' },
  { name: 'Iris Support', email: 'it.employee@ims.com', role: 'EMPLOYEE', department: 'IT' },

  // HR / Finance department
  { name: 'Hannah HRhead', email: 'hr.manager@ims.com', role: 'MANAGER', department: 'HR_FINANCE' },
  { name: 'Henry Finance', email: 'hr.employee@ims.com', role: 'EMPLOYEE', department: 'HR_FINANCE' },
];

async function main() {
  console.log('Seeding users...\n');

  for (const u of sampleUsers) {
    const password = (u as any).password || DEFAULT_PASSWORD;
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role as any, department: u.department as any },
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role as any,
        department: u.department as any,
      },
    });

    console.log(`  ✓ ${user.role.padEnd(8)} ${(user.department || 'ALL').padEnd(11)} ${user.email}  (password: ${password})`);
  }

  console.log('\nSeed complete. Login with any email above.');
  console.log('Default password for department users: password123');
  console.log('Admin password: admin123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
