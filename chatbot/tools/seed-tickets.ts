// tools/seed-db.ts
import  prisma  from '@/lib/prisma';

async function seedCompanies() {
  const companies = [
    { name: 'TechCo Inc', subdomain: 'techo' },
    { name: 'RetailCo Ltd', subdomain: 'retailo' }
  ];

  for (const company of companies) {
    const existing = await prisma.company.findUnique({
      where: { subdomain: company.subdomain }
    });

    if (!existing) {
      await prisma.company.create({ data: company });
      console.log(`✅ Created company: ${company.name}`);
    }
  }

  console.log('✅ Companies seeded');
}

async function seedTickets() {
  const companies = await prisma.company.findMany({
    where: {
      subdomain: { in: ['techo', 'retailo'] }
    }
  });

  if (companies.length === 0) {
    console.error('❌ No companies found. Run seedCompanies() first.');
    return;
  }

  const tickets = companies.flatMap(company => [
    {
      companyId: company.id,
      subject: 'Billing Issue',
      status: 'OPEN',
      priority: 4
    },
    {
      companyId: company.id,
      subject: 'Login Issue',
      status: 'OPEN',
      priority: 3
    }
  ]);

  await prisma.ticket.deleteMany(); // Clear old data
  await prisma.ticket.createMany({ data: tickets });
  console.log('✅ Tickets seeded');
}

async function seedEverything() {
  try {
    await seedCompanies();
    await seedTickets();
    console.log('🎉 All data seeded successfully');
  } catch (error: any) {
    console.error('❌ Seed failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedEverything();