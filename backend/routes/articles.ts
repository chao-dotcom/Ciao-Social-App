import express, { Router } from 'express';
import * as articleController from '../controllers/articleController';
import * as commentController from '../controllers/commentController';
import { isAuthenticated, optionalAuth, isOwner } from '../middleware/auth';
import { validateArticle, validateComment, validatePagination } from '../middleware/validation';
import Article from '../models/Article';
import { uploadArticleImages } from '../config/cloudinary';

const router: Router = express.Router();

// Get user's feed
router.get('/', isAuthenticated, validatePagination as any, articleController.getFeed);

// IMPORTANT: Specific routes MUST come before parameterized routes!
// Get articles by author (must be before /:id route)
router.get('/user/:username', optionalAuth, validatePagination as any, articleController.getArticlesByAuthor);

// Get comments for an article (MUST BE BEFORE /:id to avoid conflict)
router.get('/:id/comments', validatePagination as any, commentController.getComments);

// Add comment to article (MUST BE BEFORE /:id to avoid conflict)
router.post('/:id/comments', isAuthenticated, validateComment as any, commentController.createComment);

// Get single article (must be AFTER /user/:username and /:id/comments)
router.get('/:id', optionalAuth, articleController.getArticle);

// Note: POST /article (singular) is handled by routes/article.ts

// Update article
router.put('/:id', isAuthenticated, isOwner(Article), validateArticle as any, articleController.updateArticle);

// Delete article
router.delete('/:id', isAuthenticated, isOwner(Article), articleController.deleteArticle);

// Toggle like
router.put('/:id/like', isAuthenticated, articleController.toggleLike);

export default router;
