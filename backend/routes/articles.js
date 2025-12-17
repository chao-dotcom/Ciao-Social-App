const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const commentController = require('../controllers/commentController');
const { isAuthenticated, optionalAuth } = require('../middleware/auth');
const { isOwner } = require('../middleware/auth');
const { validateArticle, validateComment, validatePagination } = require('../middleware/validation');
const Article = require('../models/Article');
const { uploadArticleImages } = require('../config/cloudinary');

// Get user's feed
router.get('/', isAuthenticated, validatePagination, articleController.getFeed);

// IMPORTANT: Specific routes MUST come before parameterized routes!
// Get articles by author (must be before /:id route)
router.get('/user/:username', optionalAuth, validatePagination, articleController.getArticlesByAuthor);

// Get comments for an article (MUST BE BEFORE /:id to avoid conflict)
router.get('/:id/comments', validatePagination, commentController.getComments);

// Add comment to article (MUST BE BEFORE /:id to avoid conflict)
router.post('/:id/comments', isAuthenticated, validateComment, commentController.createComment);

// Get single article (must be AFTER /user/:username and /:id/comments)
router.get('/:id', optionalAuth, articleController.getArticle);

// Note: POST /article (singular) is handled by routes/article.js

// Update article
router.put('/:id', isAuthenticated, isOwner(Article), validateArticle, articleController.updateArticle);

// Delete article
router.delete('/:id', isAuthenticated, isOwner(Article), articleController.deleteArticle);

// Toggle like
router.put('/:id/like', isAuthenticated, articleController.toggleLike);

module.exports = router;

