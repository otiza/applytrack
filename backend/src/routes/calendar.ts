import { Router, type Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/interviews', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const interviews = await prisma.application.findMany({
      where: {
        userId: req.user!.id,
        interviewDate: {
          not: null
        }
      },
      orderBy: {
        interviewDate: 'asc'
      },
      select: {
        id: true,
        jobTitle: true,
        interviewDate: true,
        status: true,
        priority: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });

    return res.json({ interviews });
  } catch (error) {
    console.error('Error loading interview calendar:', error);
    return res.status(500).json({ error: 'Failed to load interview calendar.' });
  }
});

export default router;
