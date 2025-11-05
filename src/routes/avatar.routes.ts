import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (_req, res) => {
  const items = await prisma.profileImage.findMany({
    where: { isActive: true },
    select: { id: true, url: true, label: true },
    orderBy: { id: 'asc' },
  });
  res.json({ items });
});


router.post('/seed', async (_req, res) => {
  const files = [
    '/uploads/avatars/avatar1.jpeg',
    '/uploads/avatars/avatar2.jpeg',
    '/uploads/avatars/avatar3.jpeg',
  ];
  for (const [i, url] of files.entries()) {
    await prisma.profileImage.upsert({
      where: { url },
      create: { url, label: `Avatar ${i + 1}`, isActive: true },
      update: {},
    });
  }
  res.json({ ok: true, count: files.length });
});

router.get('/', async (_req, res) => {
  const items = await prisma.profileImage.findMany({
    where: { isActive: true },
    select: { id: true, url: true, label: true },
    orderBy: { id: 'asc' },
  });
  res.json({ items });
});


export default router;