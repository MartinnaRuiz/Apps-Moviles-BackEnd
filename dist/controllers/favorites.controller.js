"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFavorite = exports.addFavorite = exports.getFavorites = void 0;
const prisma_1 = require("../lib/prisma");
// GET /api/favorites - Obtener todos los favoritos del usuario
const getFavorites = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'No autorizado' });
        }
        const favorites = await prisma_1.prisma.favorite.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(favorites);
    }
    catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ message: 'Error al obtener favoritos' });
    }
};
exports.getFavorites = getFavorites;
// POST /api/favorites - Agregar película a favoritos
const addFavorite = async (req, res) => {
    try {
        const userId = req.userId;
        const { movieId, title, posterPath, releaseDate } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'No autorizado' });
        }
        if (!movieId || !title) {
            return res.status(400).json({ message: 'movieId y title son requeridos' });
        }
        // Verificar si ya existe en favoritos
        const existingFavorite = await prisma_1.prisma.favorite.findUnique({
            where: {
                userId_movieId: {
                    userId,
                    movieId: movieId.toString(),
                },
            },
        });
        if (existingFavorite) {
            return res.status(400).json({ message: 'Ya está en favoritos' });
        }
        // Crear nuevo favorito
        const favorite = await prisma_1.prisma.favorite.create({
            data: {
                userId,
                movieId: movieId.toString(),
                title,
                posterPath: posterPath || null,
                releaseDate: releaseDate ? new Date(releaseDate) : null,
            },
        });
        res.status(201).json(favorite);
    }
    catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ message: 'Error al agregar favorito' });
    }
};
exports.addFavorite = addFavorite;
// DELETE /api/favorites/:movieId - Eliminar película de favoritos
const removeFavorite = async (req, res) => {
    try {
        const userId = req.userId;
        const { movieId } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'No autorizado' });
        }
        // Eliminar favorito
        await prisma_1.prisma.favorite.delete({
            where: {
                userId_movieId: {
                    userId,
                    movieId,
                },
            },
        });
        res.json({ message: 'Favorito eliminado' });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Favorito no encontrado' });
        }
        console.error('Error removing favorite:', error);
        res.status(500).json({ message: 'Error al eliminar favorito' });
    }
};
exports.removeFavorite = removeFavorite;
