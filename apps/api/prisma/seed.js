import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Populando banco de dados com dados iniciais de teste...');

  // 1. Cria ou reutiliza uma organização/proponente de teste
  let proponent = await prisma.proponent.findFirst({
    where: { email: 'contato@ecologica.com' },
  });

  if (!proponent) {
    proponent = await prisma.proponent.create({
      data: {
        name: 'Empresa Ecológica Teste',
        email: 'contato@ecologica.com',
      },
    });
    console.log('✅ Proponente criado:', proponent.name);
  }

  // 2. Hash da senha de teste: 'senha123'
  const hashedPassword = await bcrypt.hash('senha123', 10);

  // 3. Cria ou atualiza o usuário de teste
  const user = await prisma.user.upsert({
    where: { email: 'admin@arthemis.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      proponentId: proponent.id,
      username: 'admin',
      email: 'admin@arthemis.com',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log('✅ Usuário de teste pronto:');
  console.log('   E-mail: admin@arthemis.com');
  console.log('   Senha:  senha123');
  console.log('   Role:  ', user.role);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
