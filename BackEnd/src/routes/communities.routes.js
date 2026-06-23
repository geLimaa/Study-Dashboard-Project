import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/async-handler.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const communities = await prisma.community.findMany({
    orderBy: [{ members: 'desc' }, { createdAt: 'desc' }],
    include: {
      memberships: {
        where: { userId: req.user.id },
        select: { id: true },
      },
    },
  });

  const payload = communities.map((community) => ({
    id: community.id,
    title: community.title,
    slug: community.slug,
    members: community.members,
    icon: community.icon,
    description: community.description,
    joined: community.memberships.length > 0,
  }));

  return res.json({ status: 'ok', communities: payload });
}));

router.post('/:id/join', asyncHandler(async (req, res) => {
  const community = await prisma.community.findUnique({
    where: { id: req.params.id },
  });

  if (!community) {
    return res.status(404).json({
      status: 'error',
      message: 'Community not found',
    });
  }

  const existingMembership = await prisma.communityMember.findUnique({
    where: {
      userId_communityId: {
        userId: req.user.id,
        communityId: community.id,
      },
    },
  });

  if (!existingMembership) {
    await prisma.communityMember.create({
      data: {
        userId: req.user.id,
        communityId: community.id,
      },
    });

    await prisma.community.update({
      where: { id: community.id },
      data: { members: { increment: 1 } },
    });

    return res.status(201).json({
      status: 'ok',
      message: 'Joined community',
    });
  }

  return res.status(200).json({
    status: 'ok',
    message: 'Already joined',
  });
}));

router.delete('/:id/leave', asyncHandler(async (req, res) => {
  const community = await prisma.community.findUnique({
    where: { id: req.params.id },
  });

  if (!community) {
    return res.status(404).json({
      status: 'error',
      message: 'Community not found',
    });
  }

  const result = await prisma.communityMember.deleteMany({
    where: {
      userId: req.user.id,
      communityId: community.id,
    },
  });

  if (result.count > 0) {
    await prisma.community.update({
      where: { id: community.id },
      data: { members: { decrement: 1 } },
    });
  }

  return res.status(204).send();
}));

export default router;
