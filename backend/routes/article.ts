import express, { Router } from 'express';
import * as articleController from '../controllers/articleController';
import { isAuthenticated } from '../middleware/auth';
import { validateArticle } from '../middleware/validation';
import { uploadArticleImages } from '../config/cloudinary';

const router: Router = express.Router();

// POST /article - Create new article (singular endpoint as per spec)
router.post('/', isAuthenticated, (req, res, next) => {
  uploadArticleImages(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: { message: err.message }
      });
    }
    next();
  });
}, validateArticle as any, articleController.createArticle);

export default router;
