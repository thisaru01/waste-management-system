import { Router } from 'express';
import { login } from '../../controllers/auth/auth.controller.js';

const router = Router();

router.post('/login', login);

export default router;
