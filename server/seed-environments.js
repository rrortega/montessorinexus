import './env.js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('🌱 Seeding Environments for Ceiba...');
  const ceiba = await prisma.school.findUnique({ where: { slug: 'ceiba' } });
  if (!ceiba) {
    console.error('Ceiba school not found');
    process.exit(1);
  }

  const environments = [
    { name: 'Nido', stage: 'Infancia Temprana', minAgeYears: 0, maxAgeYears: 1.5, color: '#0284c7', description: 'Bebés desde los primeros meses hasta caminar con seguridad.' },
    { name: 'Comunidad Infantil', stage: 'Infancia Temprana', minAgeYears: 1.5, maxAgeYears: 3, color: '#059669', description: 'Movimiento, lenguaje, independencia y control de esfínteres.' },
    { name: 'Casa de Niños', stage: 'Preescolar / Kínder', minAgeYears: 3, maxAgeYears: 6, color: '#1b3b2b', description: 'Vida práctica, sensorial, lenguaje, matemáticas y cultura.' },
    { name: 'Taller I (Primaria Baja)', stage: 'Primaria', minAgeYears: 6, maxAgeYears: 9, color: '#d97706', description: 'Educación cósmica, mente razonadora y pensamiento abstracto.' },
    { name: 'Taller II (Primaria Alta)', stage: 'Primaria', minAgeYears: 9, maxAgeYears: 12, color: '#c86d51', description: 'Investigación profunda, autonomía moral y ciencia.' },
    { name: 'Erdkinder / Adolescentes', stage: 'Secundaria', minAgeYears: 12, maxAgeYears: 15, color: '#581c87', description: 'Trabajo con la tierra, economía práctica y proyectos globales.' }
  ];

  for (const envData of environments) {
    const existing = await prisma.environment.findFirst({
      where: { schoolId: ceiba.id, name: envData.name }
    });
    if (!existing) {
      const created = await prisma.environment.create({
        data: {
          schoolId: ceiba.id,
          ...envData
        }
      });
      console.log(`✅ Created environment: ${created.name}`);
    } else {
      console.log(`ℹ️ Environment already exists: ${existing.name}`);
    }
  }

  // Link sample students
  const comunidad = await prisma.environment.findFirst({ where: { schoolId: ceiba.id, name: 'Comunidad Infantil' } });
  const casa = await prisma.environment.findFirst({ where: { schoolId: ceiba.id, name: 'Casa de Niños' } });

  if (comunidad) {
    await prisma.student.updateMany({
      where: { schoolId: ceiba.id, fullName: 'Mateo Gómez' },
      data: { environmentId: comunidad.id }
    });
    console.log('✅ Mateo linked to Comunidad Infantil');
  }

  if (casa) {
    await prisma.student.updateMany({
      where: { schoolId: ceiba.id, fullName: 'Sofía Gómez' },
      data: { environmentId: casa.id }
    });
    console.log('✅ Sofía linked to Casa de Niños');
  }

  console.log('✨ Seed finished successfully!');
  await prisma.$disconnect();
  await pool.end();
}

seed().catch(console.error);
