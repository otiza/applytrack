import bcrypt from 'bcryptjs';
import { PrismaClient, ApplicationPriority, ApplicationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'abdes@abdes.abdes' },
    update: {
      name: 'Abdes Test',
      passwordHash
    },
    create: {
      email: 'abdes@abdes.abdes',
      name: 'Abdes Test',
      passwordHash
    }
  });

  await prisma.note.deleteMany({ where: { userId: user.id } });
  await prisma.application.deleteMany({ where: { userId: user.id } });
  await prisma.company.deleteMany({ where: { userId: user.id } });

  const companies = await prisma.company.createManyAndReturn({
    data: [
      {
        name: 'Google',
        website: 'https://careers.google.com',
        location: 'Paris, France',
        industry: 'Technologie',
        notes: 'Equipe Cloud et IA',
        userId: user.id
      },
      {
        name: 'Microsoft',
        website: 'https://careers.microsoft.com',
        location: 'Dublin, Ireland',
        industry: 'Technologie',
        notes: 'Offres orientees Azure et plateformes data',
        userId: user.id
      },
      {
        name: 'Amazon',
        website: 'https://www.amazon.jobs',
        location: 'Luxembourg, Luxembourg',
        industry: 'E-commerce / Cloud',
        notes: 'Roles backend et distributed systems',
        userId: user.id
      },
      {
        name: 'Spotify',
        website: 'https://www.lifeatspotify.com/jobs',
        location: 'Stockholm, Sweden',
        industry: 'Streaming',
        notes: 'Stack orientee microservices et data products',
        userId: user.id
      },
      {
        name: 'Doctolib',
        website: 'https://careers.doctolib.com',
        location: 'Paris, France',
        industry: 'HealthTech',
        notes: 'Produit B2B/B2C dans la sante',
        userId: user.id
      },
      {
        name: 'Dataiku',
        website: 'https://www.dataiku.com/careers',
        location: 'Paris, France',
        industry: 'IA / Data Science',
        notes: 'Plateforme data pour entreprises',
        userId: user.id
      },
      {
        name: 'OVHcloud',
        website: 'https://careers.ovhcloud.com',
        location: 'Roubaix, France',
        industry: 'Cloud',
        notes: 'Infra cloud et securite',
        userId: user.id
      },
      {
        name: 'Back Market',
        website: 'https://www.backmarket.com/jobs',
        location: 'Paris, France',
        industry: 'E-commerce',
        notes: 'Produit web international',
        userId: user.id
      },
      {
        name: 'Airbnb',
        website: 'https://careers.airbnb.com',
        location: 'Remote Europe',
        industry: 'TravelTech',
        notes: 'Role full remote orientee plateforme',
        userId: user.id
      },
      {
        name: 'BlaBlaCar',
        website: 'https://jobs.blablacar.com',
        location: 'Paris, France',
        industry: 'Mobility',
        notes: 'Equipe produit orientee croissance',
        userId: user.id
      }
    ]
  });

  const companyByName = new Map(companies.map((company) => [company.name, company]));

  const applications = [
    {
      jobTitle: 'Senior Frontend Engineer (React)',
      companyId: companyByName.get('Google')!.id,
      status: ApplicationStatus.INTERVIEW,
      priority: ApplicationPriority.HIGH,
      location: 'Paris, France',
      salaryRange: '75k€ - 95k€',
      contractType: 'CDI',
      applicationDate: new Date('2026-04-03T09:00:00.000Z'),
      interviewDate: new Date('2026-05-02T10:30:00.000Z'),
      recruiterName: 'Sofia Martin',
      recruiterEmail: 'sofia.martin@google.com',
      jobPostUrl: 'https://careers.google.com',
      notes: 'Premier entretien technique valide, preparation system design',
      userId: user.id
    },
    {
      jobTitle: 'Full Stack TypeScript Developer',
      companyId: companyByName.get('Doctolib')!.id,
      status: ApplicationStatus.APPLIED,
      priority: ApplicationPriority.MEDIUM,
      location: 'Paris, France',
      salaryRange: '58k€ - 72k€',
      contractType: 'CDI',
      applicationDate: new Date('2026-04-08T12:00:00.000Z'),
      recruiterName: 'Nadia Dupont',
      recruiterEmail: 'nadia.dupont@doctolib.com',
      jobPostUrl: 'https://careers.doctolib.com',
      notes: 'Candidature envoyee avec CV orientee produit',
      userId: user.id
    },
    {
      jobTitle: 'Backend Engineer - Distributed Systems',
      companyId: companyByName.get('Amazon')!.id,
      status: ApplicationStatus.TECHNICAL_TEST,
      priority: ApplicationPriority.HIGH,
      location: 'Luxembourg, Luxembourg',
      salaryRange: '80k€ - 105k€',
      contractType: 'Permanent',
      applicationDate: new Date('2026-04-12T15:30:00.000Z'),
      recruiterName: 'Luca Bernardi',
      recruiterEmail: 'luca.bernardi@amazon.com',
      jobPostUrl: 'https://www.amazon.jobs',
      notes: 'Exercice algorithmique a rendre avant vendredi',
      userId: user.id
    },
    {
      jobTitle: 'Platform Engineer - Kubernetes',
      companyId: companyByName.get('OVHcloud')!.id,
      status: ApplicationStatus.WISHLIST,
      priority: ApplicationPriority.LOW,
      location: 'Roubaix, France',
      salaryRange: '52k€ - 65k€',
      contractType: 'CDI',
      recruiterName: 'Thomas Leroy',
      recruiterEmail: 'thomas.leroy@ovhcloud.com',
      jobPostUrl: 'https://careers.ovhcloud.com',
      notes: 'Entreprise cible pour montee en competences SRE',
      userId: user.id
    },
    {
      jobTitle: 'Data Engineer (Python + SQL)',
      companyId: companyByName.get('Dataiku')!.id,
      status: ApplicationStatus.APPLIED,
      priority: ApplicationPriority.HIGH,
      location: 'Paris, France',
      salaryRange: '60k€ - 78k€',
      contractType: 'CDI',
      applicationDate: new Date('2026-04-16T11:10:00.000Z'),
      recruiterName: 'Claire Fontaine',
      recruiterEmail: 'claire.fontaine@dataiku.com',
      jobPostUrl: 'https://www.dataiku.com/careers',
      notes: 'Role tres aligne avec experience ETL',
      userId: user.id
    },
    {
      jobTitle: 'Product Engineer',
      companyId: companyByName.get('Spotify')!.id,
      status: ApplicationStatus.REJECTED,
      priority: ApplicationPriority.MEDIUM,
      location: 'Stockholm, Sweden',
      salaryRange: '65k€ - 85k€',
      contractType: 'Permanent',
      applicationDate: new Date('2026-03-20T13:30:00.000Z'),
      recruiterName: 'Emma Nilsson',
      recruiterEmail: 'emma.nilsson@spotify.com',
      jobPostUrl: 'https://www.lifeatspotify.com/jobs',
      notes: 'Feedback: profil solide mais manque d experience streaming audio',
      userId: user.id
    },
    {
      jobTitle: 'Software Engineer - Marketplace',
      companyId: companyByName.get('Back Market')!.id,
      status: ApplicationStatus.INTERVIEW,
      priority: ApplicationPriority.HIGH,
      location: 'Paris, France',
      salaryRange: '58k€ - 75k€',
      contractType: 'CDI',
      applicationDate: new Date('2026-04-05T09:45:00.000Z'),
      interviewDate: new Date('2026-05-04T14:00:00.000Z'),
      recruiterName: 'Yanis Benali',
      recruiterEmail: 'yanis.benali@backmarket.com',
      jobPostUrl: 'https://www.backmarket.com/jobs',
      notes: 'Entretien RH passe, prochain round avec lead engineer',
      userId: user.id
    },
    {
      jobTitle: 'Senior Software Engineer - Growth',
      companyId: companyByName.get('Airbnb')!.id,
      status: ApplicationStatus.OFFER,
      priority: ApplicationPriority.HIGH,
      location: 'Remote Europe',
      salaryRange: '95k€ - 120k€',
      contractType: 'Permanent',
      applicationDate: new Date('2026-03-28T10:20:00.000Z'),
      recruiterName: 'Paula Herrera',
      recruiterEmail: 'paula.herrera@airbnb.com',
      jobPostUrl: 'https://careers.airbnb.com',
      notes: 'Offre recue, en attente de decision finale',
      userId: user.id
    },
    {
      jobTitle: 'Cloud Engineer - Azure Platform',
      companyId: companyByName.get('Microsoft')!.id,
      status: ApplicationStatus.TECHNICAL_TEST,
      priority: ApplicationPriority.MEDIUM,
      location: 'Dublin, Ireland',
      salaryRange: '70k€ - 92k€',
      contractType: 'Permanent',
      applicationDate: new Date('2026-04-14T08:10:00.000Z'),
      recruiterName: 'Brendan Walsh',
      recruiterEmail: 'brendan.walsh@microsoft.com',
      jobPostUrl: 'https://careers.microsoft.com',
      notes: 'Case study architecture cloud en preparation',
      userId: user.id
    },
    {
      jobTitle: 'Backend Engineer - Mobility Platform',
      companyId: companyByName.get('BlaBlaCar')!.id,
      status: ApplicationStatus.APPLIED,
      priority: ApplicationPriority.MEDIUM,
      location: 'Paris, France',
      salaryRange: '55k€ - 70k€',
      contractType: 'CDI',
      applicationDate: new Date('2026-04-18T16:15:00.000Z'),
      recruiterName: 'Julie Roche',
      recruiterEmail: 'julie.roche@blablacar.com',
      jobPostUrl: 'https://jobs.blablacar.com',
      notes: 'Postule via referral interne',
      userId: user.id
    }
  ];

  const createdApplications = [] as { id: string; jobTitle: string }[];

  for (const application of applications) {
    const created = await prisma.application.create({
      data: application
    });
    createdApplications.push({ id: created.id, jobTitle: created.jobTitle });
  }

  const frontendInterview = createdApplications.find((app) => app.jobTitle.includes('Frontend Engineer'));
  const backendTest = createdApplications.find((app) => app.jobTitle.includes('Distributed Systems'));
  const offerRole = createdApplications.find((app) => app.jobTitle.includes('Growth'));

  await prisma.note.createMany({
    data: [
      {
        content: 'Preparer un mini projet React pour illustrer la qualite de code et les tests.',
        userId: user.id,
        applicationId: frontendInterview?.id
      },
      {
        content: 'Resoudre 3 exercices LeetCode medium avant la date limite du test.',
        userId: user.id,
        applicationId: backendTest?.id
      },
      {
        content: 'Verifier package de relocation et politique remote avant acceptation.',
        userId: user.id,
        applicationId: offerRole?.id
      },
      {
        content: 'Adapter le CV selon le role: backend, data, ou full-stack produit.',
        userId: user.id
      }
    ]
  });

  console.log('Seed complete. Demo login: abdes@abdes.abdes / password123');
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
