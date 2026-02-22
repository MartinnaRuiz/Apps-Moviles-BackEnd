import { Router } from 'express';
import * as favoritesController from '../controllers/favorites.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', favoritesController.getFavorites);

router.post('/', authenticateToken, favoritesController.addFavorite);

router.delete('/:movieId', authenticateToken, favoritesController.removeFavorite);

export default router;
