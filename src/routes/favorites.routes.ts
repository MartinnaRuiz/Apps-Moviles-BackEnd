import { Router } from 'express';
import * as favoritesController from '../controllers/favorites.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/favorites - Obtener todos los favoritos del usuario
router.get('/', favoritesController.getFavorites);

// POST /api/favorites - Agregar una película a favoritos
router.post('/', favoritesController.addFavorite);

// DELETE /api/favorites/:movieId - Eliminar una película de favoritos
router.delete('/:movieId', favoritesController.removeFavorite);

export default router;
