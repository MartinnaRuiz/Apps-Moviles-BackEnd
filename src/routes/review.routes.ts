import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authRequired, AuthedRequest } from '../middlewares/authRequired';

const router = Router();

router.post('/', authRequired, async (req: AuthedRequest, res) => {
  try {
    const movieId = String(req.body.movieId);
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

router.get('/', async (req, res) => {
  const movieId = req.query.movieId ? String(req.query.movieId) : null;
  const userId = req.query.userId ? Number(req.query.userId) : null;

  if (!movieId && !userId) {
    return res.status(400).json({ message: 'movieId o userId requerido' });
  }

  const where: any = {};
  if (movieId) where.movieId = movieId;
  if (userId) where.userId = userId;

  const reviews = await prisma.review.findMany({
    where,
    include: {
      user: { select: { id: true, username: true, name: true, profileImage: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ reviews });
});

router.get('/my-reviews', authRequired, async (req: AuthedRequest, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ reviews });
  } catch (e) {
    console.error('GET /reviews/my-reviews error', e);
    res.status(500).json({ message: 'Error al obtener reseñas' });
  }
});


router.get('/recent', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: {
              select: { url: true }
            }
          }
        }
      }
    });

    const reviewsWithMovies = await Promise.all(
      reviews.map(async (review) => {
        try {
          const movieRes = await fetch(
            `https://api.themoviedb.org/3/movie/${review.movieId}?api_key=${process.env.TMDB_API_KEY}&language=es-ES`
          );
          if (movieRes.ok) {
            const movie = await movieRes.json();
            return {
              ...review,
              movie: {
                title: movie.title,
                poster_path: movie.poster_path
              }
            };
          }
        } catch (error) {
          console.error(`Error fetching movie ${review.movieId}:`, error);
        }
        return review;
      })
    );

    res.json({ reviews: reviewsWithMovies });
  } catch (error) {
    console.error('Error fetching recent reviews:', error);
    res.status(500).json({ error: 'Failed to fetch recent reviews' });
  }
});
router.delete('/:id', authRequired, async (req: AuthedRequest, res) => {
  try {
    const reviewId = Number(req.params.id);
    
    // Obtener la reseña
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });
    
    if (!review) {
      return res.status(404).json({ message: 'Reseña no encontrada' });
    }
    
    // Verificar que el usuario sea el dueño
    if (review.userId !== req.userId) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta reseña' });
    }
    
    // Eliminar
    await prisma.review.delete({
      where: { id: reviewId }
    });
    
    res.json({ message: 'Reseña eliminada' });
  } catch (e) {
    console.error('DELETE /reviews/:id error', e);
    res.status(500).json({ message: 'Error al eliminar la reseña' });
  }
});
export default router;
