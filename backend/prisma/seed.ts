import { PrismaClient, ApplicationPriority, ApplicationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'alex@applytrack.dev' },
    update: {},
    create: {
      email: 'alex@applytrack.dev',
      name: 'Alex Morgan'
    }
  });

  const companies = await Promise.all([
    prisma.company.upsert({
      where: { id: 'company_acme' },
      update: {},
      create: {
        id: 'company_acme',
        name: 'Acme Analytics',
        website: 'https://acmeanalytics.example',
        location: 'Remote',
        userId: user.id
      }
    }),
    prisma.company.upsert({
      where: { id: 'company_northstar' },
      update: {},
      create: {
        id: 'company_northstar',
        name: 'Northstar Labs',
        website: 'https://northstarlabs.example',
        location: 'Berlin, Germany',
        userId: user.id
      }
    }),
    prisma.company.upsert({
      where: { id: 'company_pivot' },
      update: {},
      create: {
        id: 'company_pivot',
        name: 'Pivot Systems',
        website: 'https://pivotsystems.example',
        location: 'New York, USA',
        userId: user.id
      }
    })
  ]);

  const applications = [
    {
      title: 'Senior Frontend Engineer',
      role: 'Frontend Engineer',
      companyId: companies[0].id,
      status: ApplicationStatus.INTERVIEW,
      priority: ApplicationPriority.HIGH,
      location: 'Remote',
      appliedAt: new Date('2026-04-10T09:00:00.000Z')
    },
    {
      title: 'Full Stack TypeScript Developer',
      role: 'Full Stack Developer',
      companyId: companies[1].id,
      status: ApplicationStatus.APPLIED,
      priority: ApplicationPriority.MEDIUM,
      location: 'Berlin, Germany',
      appliedAt: new Date('2026-04-15T12:00:00.000Z')
    },
    {
      title: 'Product Engineer',
      role: 'Product Engineer',
      companyId: companies[2].id,
      status: ApplicationStatus.TECHNICAL_TEST,
      priority: ApplicationPriority.HIGH,
      location: 'New York, USA',
      appliedAt: new Date('2026-04-18T15:30:00.000Z')
    },
    {
      title: 'Platform Engineer',
      role: 'Platform Engineer',
      companyId: companies[0].id,
      status: ApplicationStatus.WISHLIST,
      priority: ApplicationPriority.LOW,
      location: 'Remote'
    }
  ];

  const createdApplications = [] as { id: string }[];

  for (const application of applications) {
    const created = await prisma.application.create({
      data: {
        ...application,
        userId: user.id
      }
    });
    createdApplications.push({ id: created.id });
  }

  await prisma.note.createMany({
    data: [
      {
        content: 'Reached out to hiring manager after the first screening.',
        userId: user.id,
        applicationId: createdApplications[0].id
      },
      {
        content: 'Send portfolio update before technical test deadline.',
        userId: user.id,
        applicationId: createdApplications[2].id
      },
      {
        content: 'Research team structure and recent product launches.',
        userId: user.id,
        applicationId: createdApplications[1].id
      },
      {
        content: 'General reminder: keep résumé version for platform roles polished.',
        userId: user.id
      }
    ]
  });

  console.log('Seed complete: created demo user, companies, applications, and notes.');
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

