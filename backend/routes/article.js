const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { isAuthenticated } = require('../middleware/auth');
const { validateArticle } = require('../middleware/validation');
const { uploadArticleImages } = require('../config/cloudinary');

// POST /article - Create new article (singular endpoint as per spec)
router.post('/', isAuthenticated, (req, res, next) => {
  uploadArticleImages(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: { message: err.message }
      });
    }
    next();
  });
}, validateArticle, articleController.createArticle);

module.exports = router;

