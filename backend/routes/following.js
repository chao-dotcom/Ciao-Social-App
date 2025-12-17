const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');
const { validateUsername } = require('../middleware/validation');

// Follow user
router.put('/:username', isAuthenticated, validateUsername, userController.followUser);

// Unfollow user
router.delete('/:username', isAuthenticated, validateUsername, userController.unfollowUser);

// Get current user's following
router.get('/', isAuthenticated, userController.getFollowing);

// Get following for a specific user
router.get('/:username', userController.getFollowing);

module.exports = router;

