import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/auth.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(60),
  email: z.string().email('Please provide a valid email.').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters.')
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email.').toLowerCase(),
  password: z.string().min(1, 'Password is required.')
});

function signToken(input: { id: string; email: string; name: string }) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT secret is not configured.');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };

  return jwt.sign(input, jwtSecret, options);
}

router.post('/register', async (req, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid input.',
      details: parsed.error.flatten().fieldErrors
    });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash
      }
    });

    const token = signToken({ id: user.id, email: user.email, name: user.name });

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch {
    return res.status(500).json({ error: 'Could not register user. Please try again.' });
  }
});

router.post('/login', async (req, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid input.',
      details: parsed.error.flatten().fieldErrors
    });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken({ id: user.id, email: user.email, name: user.name });

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch {
    return res.status(500).json({ error: 'Could not log in. Please try again.' });
  }
});

router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ user });
  } catch {
    return res.status(500).json({ error: 'Failed to load authenticated user.' });
  }
});

// PUT /api/auth/profile — update name and/or email
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(60),
  email: z.string().email('Please provide a valid email.').toLowerCase()
});

router.put('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input.', details: parsed.error.flatten().fieldErrors });
  }

  try {
    const { name, email } = parsed.data;

    // Check email uniqueness if it changed
    if (email !== req.user!.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, email },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    return res.json({ message: 'Profile updated.', user });
  } catch {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// PUT /api/auth/password — change password
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
  confirmPassword: z.string().min(1, 'Please confirm your new password.')
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword']
});

router.put('/password', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input.', details: parsed.error.flatten().fieldErrors });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const isMatch = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return res.json({ message: 'Password updated successfully.' });
  } catch {
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});

export default router;
