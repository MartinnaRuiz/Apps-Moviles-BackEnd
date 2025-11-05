"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const authRequired_1 = require("../middlewares/authRequired");
const router = (0, express_1.Router)();
// Crear/actualizar reseña
router.post('/', authRequired_1.authRequired, async (req, res) => {
    try {
        const movieId = String(req.body.movieId);
        const rating = Number(req.body.rating);
        const comment = String(req.body.comment || '').trim();
        if (!movieId || rating < 1 || rating > 5 || !comment) {
            return res.status(400).json({ message: 'Datos inválidos' });
        }
        const review = await prisma_1.prisma.review.upsert({
            where: { userId_movieId: { userId: req.userId, movieId } },
            create: { userId: req.userId, movieId, rating, comment },
            update: { rating, comment },
        });
        res.status(201).json({ review });
    }
    catch (e) {
        console.error('POST /reviews error', e);
        res.status(500).json({ message: 'No se pudo guardar la reseña' });
    }
});
// Listar reseñas por película
router.get('/', async (req, res) => {
    const movieId = String(req.query.movieId);
    const userId = req.query.userId ? Number(req.query.userId) : null;
    if (!movieId && !userId) {
        return res.status(400).json({ message: 'movieId o userId requerido' });
    }
    const where = {};
    if (movieId)
        where.movieId = movieId;
    if (userId)
        where.userId = userId;
    const reviews = await prisma_1.prisma.review.findMany({
        where,
        include: {
            user: { select: { id: true, username: true, name: true, profileImage: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ reviews });
});
// Obtener reviews del usuario autenticado
router.get('/my-reviews', authRequired_1.authRequired, async (req, res) => {
    try {
        const reviews = await prisma_1.prisma.review.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ reviews });
    }
    catch (e) {
        console.error('GET /reviews/my-reviews error', e);
        res.status(500).json({ message: 'Error al obtener reseñas' });
    }
});
exports.default = router;
// Get recent reviews with user and movie details  
router.get('/recent', async (req, res) => {
    try {
        const reviews = await prisma_1.prisma.review.findMany({
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
        // Fetch movie details from TMDB for each review
        const reviewsWithMovies = await Promise.all(reviews.map(async (review) => {
            try {
                const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${review.movieId}?api_key=${process.env.TMDB_API_KEY}&language=es-ES`);
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
            }
            catch (error) {
                console.error(`Error fetching movie ${review.movieId}:`, error);
            }
            return review;
        }));
        res.json({ reviews: reviewsWithMovies });
    }
    catch (error) {
        console.error('Error fetching recent reviews:', error);
        res.status(500).json({ error: 'Failed to fetch recent reviews' });
    }
});
