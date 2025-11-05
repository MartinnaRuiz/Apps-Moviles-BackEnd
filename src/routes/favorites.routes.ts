import { Router } from 'express';
import * as favoritesController from '../controllers/favorites.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', favoritesController.getFavorites);

router.post('/', favoritesController.addFavorite);

router.delete('/:movieId', favoritesController.removeFavorite);

export default router;
