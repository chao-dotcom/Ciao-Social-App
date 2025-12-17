const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, optionalAuth } = require('../middleware/auth');
const { uploadAvatar } = require('../config/cloudinary');

// PUT /avatar - Update logged-in user's avatar
router.put('/', isAuthenticated, (req, res, next) => {
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

module.exports = router;

