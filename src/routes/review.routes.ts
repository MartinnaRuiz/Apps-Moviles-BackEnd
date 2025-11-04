import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authRequired, AuthedRequest } from '../middlewares/authRequired';

const router = Router();

// Crear/actualizar reseña
router.post('/', authRequired, async (req: AuthedRequest, res) => {
  try {
    const movieId = Number(req.body.movieId);
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || '').trim();

    if (!movieId || rating < 1 || rating > 5 || !comment) {
      return res.status(400).json({ message: 'Datos inválidos' });
    }

    const review = await prisma.review.upsert({
      where: { userId_movieId: { userId: req.userId!, movieId } },
      create: { userId: req.userId!, movieId, rating, comment },
      update: { rating, comment },
    });

    res.status(201).json({ review });
  } catch (e) {
    console.error('POST /reviews error', e);
    res.status(500).json({ message: 'No se pudo guardar la reseña' });
  }
});

// Listar reseñas por película
router.get('/', async (req, res) => {
  const movieId = Number(req.query.movieId);
  if (!movieId) return res.status(400).json({ message: 'movieId requerido' });

  const reviews = await prisma.review.findMany({
    where: { movieId },
    include: {
      user: { select: { id: true, username: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ reviews });
});

export default router;
