require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const rounds = Number(process.env.BCRYPT_ROUNDS) || 12;

async function upsertUsuario({ nombre, email, password, rol }) {
  const passwordHash = await bcrypt.hash(password, rounds);
  await prisma.usuario.upsert({
    where: { email: email.toLowerCase() },
    update: {},
    create: { nombre, email: email.toLowerCase(), passwordHash, rol, activo: true },
  });
  console.log(`✔ Usuario listo: ${email} (${rol})`);
}

async function main() {
  await upsertUsuario({
    nombre: process.env.ADMIN_NOMBRE || 'Administrador',
    email: process.env.ADMIN_EMAIL || 'admin@taller.local',
    password: process.env.ADMIN_PASSWORD || 'Admin1234',
    rol: 'ADMINISTRADOR',
  });

  if (process.env.SEED_DEMO_USERS === 'true') {
    await upsertUsuario({
      nombre: 'Rosa Recepción',
      email: 'recepcion@taller.local',
      password: 'Recepcion123',
      rol: 'RECEPCIONISTA',
    });
    await upsertUsuario({
      nombre: 'Mario Mecánico',
      email: 'mecanico@taller.local',
      password: 'Mecanico123',
      rol: 'MECANICO',
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
