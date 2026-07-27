import { Router } from 'express';
import { getUsers, getDashboardStats } from '../controllers/admin.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);
router.get('/users', getUsers);
router.get('/stats', getDashboardStats);

export default router;
