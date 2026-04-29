import { Router, type Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/dashboard/stats
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();

    const [
      totalApplications,
      byStatus,
      byPriority,
      upcomingInterviews,
      recentApplications,
      totalCompanies
    ] = await Promise.all([
      // Total applications
      prisma.application.count({ where: { userId } }),

      // Applications grouped by status
      prisma.application.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true }
      }),

      // Applications grouped by priority
      prisma.application.groupBy({
        by: ['priority'],
        where: { userId },
        _count: { priority: true }
      }),

      // Upcoming interviews (interviewDate >= today, ordered soonest first)
      prisma.application.findMany({
        where: {
          userId,
          interviewDate: { gte: now }
        },
        orderBy: { interviewDate: 'asc' },
        take: 5,
        include: {
          company: { select: { id: true, name: true } }
        }
      }),

      // Recent applications (last 5 created)
      prisma.application.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          company: { select: { id: true, name: true } }
        }
      }),

      // Total companies
      prisma.company.count({ where: { userId } })
    ]);

    return res.json({
      totalApplications,
      byStatus: byStatus.map((row) => ({ status: row.status, count: row._count.status })),
      byPriority: byPriority.map((row) => ({ priority: row.priority, count: row._count.priority })),
      upcomingInterviews,
      recentApplications,
      totalCompanies
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ error: 'Failed to load dashboard stats.' });
  }
});

export default router;
