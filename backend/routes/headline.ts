import express, { Router } from 'express';
import * as userController from '../controllers/userController';
import { isAuthenticated } from '../middleware/auth';

const router: Router = express.Router();

// GET /headline/:username? - requires authentication
router.get('/:username?', isAuthenticated, userController.getHeadline);

// PUT /headline - update current user's headline
router.put('/', isAuthenticated, userController.updateHeadline);

export default router;
