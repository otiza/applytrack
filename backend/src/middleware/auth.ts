import type { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthenticatedRequest, AuthUser } from '../types/auth.js';

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing bearer token.' });
  }

  const token = authHeader.slice(7).trim();
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({ error: 'Server auth configuration is missing.' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as AuthUser;
    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: invalid or expired token.' });
  }
}

