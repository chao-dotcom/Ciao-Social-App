import express, { Router } from 'express';
import * as userController from '../controllers/userController';
import { isAuthenticated } from '../middleware/auth';
import { validateUsername } from '../middleware/validation';

const router: Router = express.Router();

// Follow user
router.put('/:username', isAuthenticated, validateUsername as any, userController.followUser);

// Unfollow user
router.delete('/:username', isAuthenticated, validateUsername as any, userController.unfollowUser);

// Get current user's following
router.get('/', isAuthenticated, userController.getFollowing);

// Get following for a specific user
router.get('/:username', userController.getFollowing);

export default router;
