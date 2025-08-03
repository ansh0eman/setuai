import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash password for system user
  const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
  const hashedPassword = await bcrypt.hash('SYSTEM', saltRounds);

  // Create system vendor if it doesn't exist
  const systemVendor = await prisma.vendor.upsert({
    where: { id: 'SYSTEM' },
    update: {},
    create: {
      id: 'SYSTEM',
      companyName: 'System',
      factoryLocation: 'System',
      complianceStatus: 'GREEN'
    }
  });

  // Create system user if it doesn't exist
  const systemUser = await prisma.user.upsert({
    where: { id: 'SYSTEM' },
    update: {},
    create: {
      id: 'SYSTEM',
      email: 'system@setuai.com',
      name: 'System',
      password: hashedPassword,
      role: 'SYSTEM_ADMIN',
      vendorId: systemVendor.id
    }
  });

  console.log('Seed data created:', { systemVendor, systemUser });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 