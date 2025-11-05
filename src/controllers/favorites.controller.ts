import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Extender Request para incluir userId del middleware de autenticación
interface AuthRequest extends Request {
  userId?: number;
}

// GET /api/favorites - Obtener todos los favoritos del usuario
export const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Error al obtener favoritos' });
  }
};

// POST /api/favorites - Agregar película a favoritos
export const addFavorite = async (req: AuthRequest, res: Response) => {
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
    const existingFavorite = await prisma.favorite.findUnique({
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
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        movieId: movieId.toString(),
        title,
        posterPath: posterPath || null,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
      },
    });

    res.status(201).json(favorite);
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Error al agregar favorito' });
  }
};

// DELETE /api/favorites/:movieId - Eliminar película de favoritos
export const removeFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { movieId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    // Eliminar favorito
    await prisma.favorite.delete({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
    });

    res.json({ message: 'Favorito eliminado' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Favorito no encontrado' });
    }
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Error al eliminar favorito' });
  }
};
