import express, { Router } from 'express';
import * as userController from '../controllers/userController';
import { isAuthenticated, optionalAuth } from '../middleware/auth';
import { validateProfileUpdate, validateUsername } from '../middleware/validation';
import { uploadAvatar } from '../config/cloudinary';

const router: Router = express.Router();

// IMPORTANT: More specific routes MUST come before general parameterized routes!

// Search users by display name or username
router.get('/search', optionalAuth, userController.searchUsers);

// Get followers (must be before /:username)
router.get('/:username/followers', validateUsername as any, userController.getFollowers);

// Get following (must be before /:username)
router.get('/:username/following', validateUsername as any, userController.getFollowing);

// Update avatar - kept for backwards compatibility (must be before /:username)
router.put('/:username/avatar', isAuthenticated, (req, res, next) => {
  uploadAvatar(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: { message: err.message }
      });
    }
    next();
  });
}, userController.updateAvatar);

// Get user profile (must be AFTER more specific routes)
router.get('/:username', optionalAuth, validateUsername as any, userController.getProfile);

// Update user profile (must be AFTER more specific routes)
router.put('/:username', isAuthenticated, validateUsername as any, validateProfileUpdate as any, userController.updateProfile);

// Delete account (must be AFTER more specific routes)
router.delete('/:username', isAuthenticated, validateUsername as any, userController.deleteAccount);

export default router;
