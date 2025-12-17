const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { isAuthenticated } = require('../middleware/auth');
const { isOwner } = require('../middleware/auth');
const { validateComment, validatePagination } = require('../middleware/validation');
const Comment = require('../models/Comment');

// Get comments for an article
router.get('/article/:articleId', validatePagination, commentController.getComments);

// Create comment
router.post('/article/:articleId', isAuthenticated, validateComment, commentController.createComment);

// Update comment
router.put('/:id', isAuthenticated, isOwner(Comment), validateComment, commentController.updateComment);

// Delete comment
router.delete('/:id', isAuthenticated, isOwner(Comment), commentController.deleteComment);

// Toggle like
router.put('/:id/like', isAuthenticated, commentController.toggleLike);

module.exports = router;

