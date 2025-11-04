import { Router } from 'express';
import { login, register, seedPrueba, health,updateMe} from '../controllers/auth.controller';
import { authRequired } from '../middlewares/authRequired';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/health', health);
router.post('/seed', seedPrueba);
router.put('/me', authRequired, updateMe);

export default router;
