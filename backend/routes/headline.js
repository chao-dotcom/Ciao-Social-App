const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');

// GET /headline/:username? - requires authentication
router.get('/:username?', isAuthenticated, userController.getHeadline);

// PUT /headline - update current user's headline
router.put('/', isAuthenticated, userController.updateHeadline);

module.exports = router;
