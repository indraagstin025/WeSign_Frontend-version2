const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'indra12@gmail.com';
  console.log(`🧹 Cleaning up documents for ${email}...`);
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('User not found, skipping cleanup.');
    return;
  }

  const deleted = await prisma.document.deleteMany({
    where: { userId: user.id }
  });

  console.log(`✅ Deleted ${deleted.count} documents.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
