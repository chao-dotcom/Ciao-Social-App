import express, { Router } from 'express';
import * as commentController from '../controllers/commentController';
import { isAuthenticated, isOwner } from '../middleware/auth';
import { validateComment, validatePagination } from '../middleware/validation';
import Comment from '../models/Comment';

const router: Router = express.Router();

// Get comments for an article
router.get('/article/:articleId', validatePagination as any, commentController.getComments);

// Create comment
router.post('/article/:articleId', isAuthenticated, validateComment as any, commentController.createComment);

// Update comment
router.put('/:id', isAuthenticated, isOwner(Comment), validateComment as any, commentController.updateComment);

// Delete comment
router.delete('/:id', isAuthenticated, isOwner(Comment), commentController.deleteComment);

// Toggle like
router.put('/:id/like', isAuthenticated, commentController.toggleLike);

export default router;
