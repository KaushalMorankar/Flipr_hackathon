// prisma/seed.ts
import prisma from '../lib/prisma';

async function main() {
  await prisma.company.create({
    data: {
      name: 'Acme Inc',
      subdomain: 'acme',
      users: {
        create: {
          email: 'admin@acme.com',
          password: 'securepassword',
          role: 'ADMIN'
        }
      }
    }
  });
}

main();