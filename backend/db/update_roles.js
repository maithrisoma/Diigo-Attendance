const prisma = require('../config/db');

async function main() {
  console.log("Updating user roles and emails in database...");

  // 1. Check if ADM001 and HR001 exist
  const adminUser = await prisma.employee.findUnique({ where: { employee_id: 'ADM001' } });
  const hrUser = await prisma.employee.findUnique({ where: { employee_id: 'HR001' } });

  if (!adminUser || !hrUser) {
    console.error("Could not find seed users ADM001 and HR001 in the database!");
    return;
  }

  // 2. Temporarily change HR001's email to avoid unique constraint conflict
  await prisma.employee.update({
    where: { employee_id: 'HR001' },
    data: { email: 'hr_temp@company.com' }
  });

  // 3. Update ADM001 to email admin@company.com and role admin
  await prisma.employee.update({
    where: { employee_id: 'ADM001' },
    data: {
      email: 'admin@company.com',
      role: 'admin',
      name: 'Super Admin',
      designation: 'General Administrator'
    }
  });

  // 4. Update HR001 to email hr@company.com and role hr
  await prisma.employee.update({
    where: { employee_id: 'HR001' },
    data: {
      email: 'hr@company.com',
      role: 'hr',
      name: 'Sarah Connor',
      designation: 'HR Director'
    }
  });

  console.log("Database updated successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
