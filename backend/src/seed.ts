import { PrismaClient } from '@prisma/client'
import { hashPassword } from './lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Créer les 4 utilisateurs prédéfinis
  const users = [
    {
      username: 'dev',
      password: await hashPassword('master!!'),
      role: 'SUPER_ADMIN',
      permissions: { all: true, logs: true, delete: true, create: true, update: true, view: true },
    },
    {
      username: 'MC-Harison',
      password: await hashPassword('admin2026'),
      role: 'ADMIN',
      permissions: { all: true, delete: true, create: true, update: true, view: true },
    },
    {
      username: 'GT-Nary',
      password: await hashPassword('admin2026'),
      role: 'ADMIN',
      permissions: { all: true, delete: true, create: true, update: true, view: true },
    },
    {
      username: 'DT-Operateur',
      password: await hashPassword('operateur2026'),
      role: 'OPERATOR',
      permissions: { delete: false, create: true, update: true, view: true, deleteRequest: true },
    },
  ]

  for (const userData of users) {
    await prisma.user.upsert({
      where: { username: userData.username },
      update: {},
      create: userData as any,
    })
    console.log(`✓ User created: ${userData.username}`)
  }

  // Créer les paramètres par défaut
  await prisma.parametre.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nomEtablissement: 'HOPITAL Y LOTERANA',
      adresse: 'Antananarivo, Madagascar',
      telephone: '+261 34 00 000 00',
    },
  })
  console.log('✓ Paramètres créés')

  console.log('✅ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
