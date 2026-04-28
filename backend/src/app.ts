import express, { type Request, type Response } from 'express';
import cors from 'cors';

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

  return app;
}
