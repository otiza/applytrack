import { Router, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/auth.js';

const router = Router();

const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters.').max(120),
  website: z.string().trim().url('Website must be a valid URL.').optional().or(z.literal('')).transform((value) => (value ? value : undefined)),
  location: z.string().trim().max(120).optional().or(z.literal('')).transform((value) => (value ? value : undefined)),
  industry: z.string().trim().max(120).optional().or(z.literal('')).transform((value) => (value ? value : undefined)),
  notes: z.string().trim().max(1000).optional().or(z.literal('')).transform((value) => (value ? value : undefined))
});

function getCompanyId(req: AuthenticatedRequest) {
  return String(req.params.id);
}

router.use(authMiddleware);

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        website: true,
        location: true,
        industry: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return res.json({ companies });
  } catch {
    return res.status(500).json({ error: 'Failed to load companies.' });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId: req.user!.id },
      select: {
        id: true,
        name: true,
        website: true,
        location: true,
        industry: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!company) return res.status(404).json({ error: 'Company not found.' });
    return res.json({ company });
  } catch {
    return res.status(500).json({ error: 'Failed to load company.' });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const parsed = companySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input.', details: parsed.error.flatten().fieldErrors });
  }

  try {
    const company = await prisma.company.create({
      data: {
        ...parsed.data,
        userId: req.user!.id
      },
      select: {
        id: true,
        name: true,
        website: true,
        location: true,
        industry: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return res.status(201).json({ message: 'Company created.', company });
  } catch {
    return res.status(500).json({ error: 'Failed to create company.' });
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const parsed = companySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input.', details: parsed.error.flatten().fieldErrors });
  }

  try {
    const companyId = getCompanyId(req);
    const existing = await prisma.company.findFirst({ where: { id: companyId, userId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: 'Company not found.' });

    const company = await prisma.company.update({
      where: { id: companyId },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        website: true,
        location: true,
        industry: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return res.json({ message: 'Company updated.', company });
  } catch {
    return res.status(500).json({ error: 'Failed to update company.' });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const existing = await prisma.company.findFirst({ where: { id: companyId, userId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: 'Company not found.' });

    await prisma.company.delete({ where: { id: companyId } });
    return res.json({ message: 'Company deleted.' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete company.' });
  }
});

export default router;
