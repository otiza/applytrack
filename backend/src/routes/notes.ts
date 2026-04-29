import { Router, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/auth.js';

const router = Router({ mergeParams: true });

const noteSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Note content cannot be empty.')
    .max(2000, 'Note must be 2000 characters or fewer.')
});

router.use(authMiddleware);

// GET /api/applications/:applicationId/notes
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const applicationId = String(req.params.applicationId);

    // Verify the application belongs to the requesting user
    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId: req.user!.id }
    });
    if (!application) return res.status(404).json({ error: 'Application not found.' });

    const notes = await prisma.note.findMany({
      where: { applicationId, userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return res.status(500).json({ error: 'Failed to load notes.' });
  }
});

// POST /api/applications/:applicationId/notes
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const parsed = noteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input.', details: parsed.error.flatten().fieldErrors });
  }

  try {
    const applicationId = String(req.params.applicationId);

    // Verify the application belongs to the requesting user
    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId: req.user!.id }
    });
    if (!application) return res.status(404).json({ error: 'Application not found.' });

    const note = await prisma.note.create({
      data: {
        content: parsed.data.content,
        userId: req.user!.id,
        applicationId
      }
    });

    return res.status(201).json({ message: 'Note created.', note });
  } catch (error) {
    console.error('Error creating note:', error);
    return res.status(500).json({ error: 'Failed to create note.' });
  }
});

export default router;

// ─── Standalone note operations ───────────────────────────────────────────────
// Mounted at /api/notes by app.ts

export const noteActionsRouter = Router();
noteActionsRouter.use(authMiddleware);

// DELETE /api/notes/:id
noteActionsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const noteId = String(req.params.id);

    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId: req.user!.id }
    });
    if (!existing) return res.status(404).json({ error: 'Note not found.' });

    await prisma.note.delete({ where: { id: noteId } });
    return res.json({ message: 'Note deleted.' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return res.status(500).json({ error: 'Failed to delete note.' });
  }
});
