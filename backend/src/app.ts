import express, { type Request, type Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import companiesRoutes from './routes/companies.js';
import applicationsRoutes from './routes/applications.js';
import dashboardRoutes from './routes/dashboard.js';
import notesRouter, { noteActionsRouter } from './routes/notes.js';
import cvsRoutes from './routes/cvs.js';
import calendarRoutes from './routes/calendar.js';

export function createApp() {
  const app = express();
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'applytrack-backend',
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/companies', companiesRoutes);
  app.use('/api/applications', applicationsRoutes);
  app.use('/api/applications/:applicationId/notes', notesRouter);
  app.use('/api/notes', noteActionsRouter);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/cvs', cvsRoutes);
  app.use('/api/calendar', calendarRoutes);

  return app;
}
