// lib/middleware.ts
export async function verifyCompanyAccess(subdomain: string, companyId: string) {
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      subdomain
    }
  });

  return !!company;
}