import express, { Router } from 'express';
import * as userController from '../controllers/userController';
import { isAuthenticated, optionalAuth } from '../middleware/auth';
import { uploadAvatar } from '../config/cloudinary';

const router: Router = express.Router();

// PUT /avatar - Update logged-in user's avatar
router.put('/', isAuthenticated, (req, res, next) => {
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

// GET /avatar/:username? - Get avatar for a user (or current user)
router.get('/:username?', optionalAuth, async (req, res, next) => {
  try {
    // delegate to controller
    req.params.username = req.params.username; // pass-through
    return userController.getAvatar(req, res, next);
  } catch (err) {
    next(err);
  }
});

export default router;
