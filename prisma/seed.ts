/**
 * DEPRECATED: This seed script is no longer used in production.
 * 
 * Initial seed data is now applied via SQL migration:
 * prisma/migrations/20260201050000_seed_initial_data/migration.sql
 * 
 * This file is kept for reference and manual seeding during local development if needed.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting manual seeding...');
  console.log('⚠️  Note: This is a manual seed. Production uses SQL migration.');

  // Check if data already exists
  const count = await prisma.treeNode.count();
  if (count > 0) {
    console.log('📊 Database already contains data. Skipping seed.');
    return;
  }

  const parent = await prisma.treeNode.create({
    data: {
      label: 'Parent',
      parentId: null,
    },
  });

  await prisma.treeNode.create({
    data: {
      label: 'First',
      parentId: parent.id,
    },
  });

  await prisma.treeNode.create({
    data: {
      label: 'Second',
      parentId: parent.id,
    },
  });

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
