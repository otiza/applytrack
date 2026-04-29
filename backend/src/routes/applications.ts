import { Router, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/auth.js';

const router = Router();

const applicationSchema = z.object({
  jobTitle: z.string().min(2, 'Job title must be at least 2 characters.').max(200),
  companyId: z.string().cuid('Invalid company ID.'),
  cvDocumentId: z.string().cuid('Invalid CV ID.').optional().or(z.literal('')).transform((value) => (value ? value : undefined)),
  location: z.string().trim().max(120).optional().or(z.literal('')).transform((value) => (value ? value : undefined)),
  salaryRange: z.string().trim().max(100).optional().or(z.literal('')).transform((value) => (value ? value : undefined)),
  contractType: z.string().trim().max(100).optional().or(z.literal('')).transform((value) => (value ? value : undefined)),
  status: z.enum(['WISHLIST', 'APPLIED', 'INTERVIEW', 'TECHNICAL_TEST', 'OFFER', 'REJECTED']).default('WISHLIST'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  applicationDate: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((value) => {
      if (!value) return undefined;
      try {
        return new Date(value);
      } catch {
        throw new Error('Invalid application date format.');
      }
    }),
  interviewDate: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((value) => {
      if (!value) return undefined;
      try {
        return new Date(value);
      } catch {
        throw new Error('Invalid interview date format.');
      }
    }),
  notes: z.string().trim().max(2000).optional().or(z.literal('')).transform((value) => (value ? value : undefined)),
  recruiterName: z.string().trim().max(120).optional().or(z.literal('')).transform((value) => (value ? value : undefined)),
  recruiterEmail: z.string().trim().email('Invalid recruiter email.').optional().or(z.literal('')).transform((value) => (value ? value : undefined)),
  jobPostUrl: z.string().trim().url('Job post URL must be a valid URL.').optional().or(z.literal('')).transform((value) => (value ? value : undefined))
});

const applicationStatusSchema = z.object({
  status: z.enum(['WISHLIST', 'APPLIED', 'INTERVIEW', 'TECHNICAL_TEST', 'OFFER', 'REJECTED'])
});

function getApplicationId(req: AuthenticatedRequest) {
  return String(req.params.id);
}

router.use(authMiddleware);

// GET /api/applications - Get all applications for user
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        cvDocument: {
          select: {
            id: true,
            name: true,
            originalFileName: true
          }
        }
      }
    });
    return res.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ error: 'Failed to load applications.' });
  }
});

// GET /api/applications/:id - Get single application
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const applicationId = getApplicationId(req);
    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId: req.user!.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            location: true,
            notes: true
          }
        },
        cvDocument: {
          select: {
            id: true,
            name: true,
            originalFileName: true
          }
        }
      }
    });

    if (!application) return res.status(404).json({ error: 'Application not found.' });
    return res.json({ application });
  } catch (error) {
    console.error('Error fetching application:', error);
    return res.status(500).json({ error: 'Failed to load application.' });
  }
});

// POST /api/applications - Create new application
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const parsed = applicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input.', details: parsed.error.flatten().fieldErrors });
  }

  try {
    // Verify company belongs to user
    const company = await prisma.company.findFirst({
      where: { id: parsed.data.companyId, userId: req.user!.id }
    });
    if (!company) return res.status(400).json({ error: 'Invalid company.' });

    if (parsed.data.cvDocumentId) {
      const cvDocument = await prisma.cvDocument.findFirst({
        where: { id: parsed.data.cvDocumentId, userId: req.user!.id },
        select: { id: true }
      });
      if (!cvDocument) return res.status(400).json({ error: 'Invalid CV document.' });
    }

    const application = await prisma.application.create({
      data: {
        ...parsed.data,
        userId: req.user!.id
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        cvDocument: {
          select: {
            id: true,
            name: true,
            originalFileName: true
          }
        }
      }
    });
    return res.status(201).json({ message: 'Application created.', application });
  } catch (error) {
    console.error('Error creating application:', error);
    return res.status(500).json({ error: 'Failed to create application.' });
  }
});

// PUT /api/applications/:id - Update application
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const parsed = applicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input.', details: parsed.error.flatten().fieldErrors });
  }

  try {
    const applicationId = getApplicationId(req);
    const existing = await prisma.application.findFirst({
      where: { id: applicationId, userId: req.user!.id }
    });
    if (!existing) return res.status(404).json({ error: 'Application not found.' });

    // Verify company belongs to user
    const company = await prisma.company.findFirst({
      where: { id: parsed.data.companyId, userId: req.user!.id }
    });
    if (!company) return res.status(400).json({ error: 'Invalid company.' });

    if (parsed.data.cvDocumentId) {
      const cvDocument = await prisma.cvDocument.findFirst({
        where: { id: parsed.data.cvDocumentId, userId: req.user!.id },
        select: { id: true }
      });
      if (!cvDocument) return res.status(400).json({ error: 'Invalid CV document.' });
    }

    const application = await prisma.application.update({
      where: { id: applicationId },
      data: parsed.data,
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        cvDocument: {
          select: {
            id: true,
            name: true,
            originalFileName: true
          }
        }
      }
    });
    return res.json({ message: 'Application updated.', application });
  } catch (error) {
    console.error('Error updating application:', error);
    return res.status(500).json({ error: 'Failed to update application.' });
  }
});

// PATCH /api/applications/:id/status - Update application status only
router.patch('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  const parsed = applicationStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input.', details: parsed.error.flatten().fieldErrors });
  }

  try {
    const applicationId = getApplicationId(req);
    const existing = await prisma.application.findFirst({
      where: { id: applicationId, userId: req.user!.id }
    });
    if (!existing) return res.status(404).json({ error: 'Application not found.' });

    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status: parsed.data.status },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        cvDocument: {
          select: {
            id: true,
            name: true,
            originalFileName: true
          }
        }
      }
    });

    return res.json({ message: 'Application status updated.', application });
  } catch (error) {
    console.error('Error updating application status:', error);
    return res.status(500).json({ error: 'Failed to update application status.' });
  }
});

// DELETE /api/applications/:id - Delete application
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const applicationId = getApplicationId(req);
    const existing = await prisma.application.findFirst({
      where: { id: applicationId, userId: req.user!.id }
    });
    if (!existing) return res.status(404).json({ error: 'Application not found.' });

    await prisma.application.delete({ where: { id: applicationId } });
    return res.json({ message: 'Application deleted.' });
  } catch (error) {
    console.error('Error deleting application:', error);
    return res.status(500).json({ error: 'Failed to delete application.' });
  }
});

export default router;

