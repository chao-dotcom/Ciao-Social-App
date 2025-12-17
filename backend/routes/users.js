const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, optionalAuth } = require('../middleware/auth');
const { validateProfileUpdate, validateUsername } = require('../middleware/validation');
const { uploadAvatar } = require('../config/cloudinary');

// IMPORTANT: More specific routes MUST come before general parameterized routes!

// Search users by display name or username
router.get('/search', optionalAuth, userController.searchUsers);

// Get followers (must be before /:username)
router.get('/:username/followers', validateUsername, userController.getFollowers);

// Get following (must be before /:username)
router.get('/:username/following', validateUsername, userController.getFollowing);

// Update avatar - kept for backwards compatibility (must be before /:username)
router.put('/:username/avatar', isAuthenticated, (req, res, next) => {
  uploadAvatar(req, res, (err) => {
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
router.get('/:username', optionalAuth, validateUsername, userController.getProfile);

// Update user profile (must be AFTER more specific routes)
router.put('/:username', isAuthenticated, validateUsername, validateProfileUpdate, userController.updateProfile);

// Delete account (must be AFTER more specific routes)
router.delete('/:username', isAuthenticated, validateUsername, userController.deleteAccount);

module.exports = router;

