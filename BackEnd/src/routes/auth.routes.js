import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/async-handler.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

const authSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(6),
  level: z.string().min(2).optional(),
});

router.post('/register', asyncHandler(async (req, res) => {
  const data = authSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name || 'Novo usuario',
      email: data.email.toLowerCase(),
      passwordHash,
      level: data.level || 'Universitario',
    },
    select: {
      id: true,
      name: true,
      email: true,
      level: true,
      theme: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const token = signToken(user);

  return res.status(201).json({
    status: 'ok',
    user,
    token,
  });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const credentials = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }).parse(req.body);

  const userRecord = await prisma.user.findUnique({
    where: { email: credentials.email.toLowerCase() },
  });

  if (!userRecord) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid credentials',
    });
  }

  const validPassword = await bcrypt.compare(credentials.password, userRecord.passwordHash);

  if (!validPassword) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid credentials',
    });
  }

  const user = {
    id: userRecord.id,
    name: userRecord.name,
    email: userRecord.email,
    level: userRecord.level,
    theme: userRecord.theme,
    createdAt: userRecord.createdAt,
    updatedAt: userRecord.updatedAt,
  };

  const token = signToken(user);

  return res.json({
    status: 'ok',
    user,
    token,
  });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  return res.json({
    status: 'ok',
    user: req.user,
  });
}));

router.patch('/me', requireAuth, asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).optional(),
    level: z.string().min(2).optional(),
    theme: z.enum(['light', 'dark']).optional(),
  });

  const data = schema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      level: true,
      theme: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.json({
    status: 'ok',
    user,
  });
}));

router.patch('/me/password', requireAuth, asyncHandler(async (req, res) => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  });

  const data = schema.parse(req.body);

  if (data.newPassword !== data.confirmPassword) {
    return res.status(400).json({
      status: 'error',
      message: 'Password confirmation does not match',
    });
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  const validPassword = await bcrypt.compare(data.currentPassword, userRecord.passwordHash);

  if (!validPassword) {
    return res.status(401).json({
      status: 'error',
      message: 'Current password is incorrect',
    });
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 10);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash },
  });

  return res.json({
    status: 'ok',
    message: 'Password updated',
  });
}));

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' },
  );
}

export default router;
