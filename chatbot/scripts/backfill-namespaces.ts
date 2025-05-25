// scripts/backfill-namespaces.ts
import prisma from '../lib/prisma';

async function main() {
  const companies = await prisma.company.findMany();
  for (const c of companies) {
    if (!c.namespace) {
      await prisma.company.update({
        where: { id: c.id },
        data: { namespace: c.subdomain }
      });
      console.log(`Backfilled ${c.name} → namespace="${c.subdomain}"`);
    }
  }
}
main()
  .catch(console.error)
  .finally(() => process.exit());
