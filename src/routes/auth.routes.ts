import { Router } from 'express';
import { login, register,seedPrueba  } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/seed', seedPrueba);
export default router;