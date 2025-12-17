import { Request, Response, NextFunction } from 'express';
import Article, { IArticle, IImage } from '../models/Article';
import User from '../models/User';
import Comment from '../models/Comment';
import { cloudinary } from '../config/cloudinary';

// Extend Express Request to include user and files info
interface AuthRequest extends Request {
  user?: {
    username: string;
    [key: string]: any;
  };
  files?: MulterFile[];
  resource?: IArticle;
}

interface MulterFile {
  path: string;
  filename: string;
  width?: number;
  height?: number;
  format?: string;
}

// Get user's feed with pagination
export const getFeed = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }
    
    // Get current user with following list
    const user = await User.findOne({ username: req.user.username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    
    // Build list of users to query (user + following)
    const usersToQuery = [user.username, ...user.following];
    
    // Single efficient MongoDB query
    const articles = await Article.find({
      author: { $in: usersToQuery },
      isDeleted: false
    })
    .sort({ createdAt: -1 }) // Most recent first
    .skip(skip)
    .limit(limitNum)
    .lean();
    
    // Populate author details
    const articlesWithAuthors = await Promise.all(
      articles.map(async (article) => {
        const author = await User.findOne({ username: article.author })
          .select('username displayName avatar');
        return {
          ...article,
          authorDetails: author
        };
      })
    );
    
    // Get total count for pagination
    const totalCount = await Article.countDocuments({
      author: { $in: usersToQuery },
      isDeleted: false
    });
    
    const totalPages = Math.ceil(totalCount / limitNum);
    
    res.json({
      success: true,
      data: {
        articles: articlesWithAuthors,
        pagination: {
          currentPage: pageNum,
          totalPages,
          pageSize: limitNum,
          totalItems: totalCount,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// Get single article
export const getArticle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article || article.isDeleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Article not found' }
      });
    }
    
    // Get author details
    const author = await User.findOne({ username: article.author })
      .select('username displayName avatar');
    
    res.json({
      success: true,
      data: {
        article: {
          ...article.toObject(),
          authorDetails: author
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// Get articles by author
export const getArticlesByAuthor = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { username } = req.params;
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const articles = await Article.find({
      author: username,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();
    
    const totalCount = await Article.countDocuments({
      author: username,
      isDeleted: false
    });
    
    const author = await User.findOne({ username })
      .select('username displayName avatar');
    
    const articlesWithAuthor = articles.map(article => ({
      ...article,
      authorDetails: author
    }));
    
    res.json({
      success: true,
      data: {
        articles: articlesWithAuthor,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          pageSize: limitNum,
          totalItems: totalCount,
          hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
          hasPreviousPage: pageNum > 1
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// Create article (with optional images)
export const createArticle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { text } = req.body;
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Article text is required' }
      });
    }
    
    // Process uploaded images
    const images: IImage[] = req.files ? req.files.map((file: MulterFile) => ({
      url: file.path,
      publicId: file.filename,
      width: file.width,
      height: file.height,
      format: file.format
    })) : [];
    
    // Extract hashtags and mentions
    const hashtags = text.match(/#[\w]+/g)?.map((tag: string) => tag.slice(1)) || [];
    const mentions = text.match(/@[\w]+/g)?.map((mention: string) => mention.slice(1)) || [];
    
    // Create article
    const article = new Article({
      text,
      images,
      author: req.user.username,
      hashtags,
      mentions
    });
    
    await article.save();
    
    // Get author details
    const author = await User.findOne({ username: req.user.username })
      .select('username displayName avatar');
    
    res.status(201).json({
      success: true,
      data: {
        article: {
          ...article.toObject(),
          authorDetails: author
        }
      },
      message: 'Article created successfully'
    });
    
  } catch (error) {
    // If error, cleanup uploaded images
    if (req.files) {
      req.files.forEach((file: MulterFile) => {
        cloudinary.uploader.destroy(file.filename).catch((err: any) => 
          console.error('Failed to delete image:', err)
        );
      });
    }
    next(error);
  }
};

// Update article
export const updateArticle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { text } = req.body;
    const article = req.resource; // Set by isOwner middleware
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: { message: 'Article not found' }
      });
    }
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Article text is required' }
      });
    }
    
    // Update article
    article.text = text;
    article.editedAt = new Date();
    
    // Update hashtags and mentions
    article.hashtags = text.match(/#[\w]+/g)?.map((tag: string) => tag.slice(1)) || [];
    article.mentions = text.match(/@[\w]+/g)?.map((mention: string) => mention.slice(1)) || [];
    
    await article.save();
    
    // Get author details
    const author = await User.findOne({ username: article.author })
      .select('username displayName avatar');
    
    res.json({
      success: true,
      data: {
        article: {
          ...article.toObject(),
          authorDetails: author
        }
      },
      message: 'Article updated successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// Delete article
export const deleteArticle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const article = req.resource; // Set by isOwner middleware
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: { message: 'Article not found' }
      });
    }
    
    // Soft delete
    article.isDeleted = true;
    await article.save();
    
    // Optionally: Delete images from Cloudinary
    if (article.images && article.images.length > 0) {
      article.images.forEach((image: IImage) => {
        if (image.publicId) {
          cloudinary.uploader.destroy(image.publicId).catch((err: any) => 
            console.error('Failed to delete image:', err)
          );
        }
      });
    }
    
    // Optionally: Delete associated comments
    await Comment.updateMany(
      { articleId: article._id },
      { isDeleted: true }
    );
    
    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// Toggle like on article
export const toggleLike = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }
    
    const article = await Article.findById(req.params.id);
    
    if (!article || article.isDeleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Article not found' }
      });
    }
    
    // Check if user already liked
    const likeIndex = article.likes.findIndex(
      like => like.username === req.user!.username
    );
    
    if (likeIndex > -1) {
      // Unlike
      article.likes.splice(likeIndex, 1);
      article.likesCount = Math.max(0, article.likesCount - 1);
    } else {
      // Like
      article.likes.push({
        username: req.user.username,
        timestamp: new Date()
      });
      article.likesCount += 1;
    }
    
    await article.save();
    
    res.json({
      success: true,
      data: {
        liked: likeIndex === -1,
        likesCount: article.likesCount
      },
      message: likeIndex === -1 ? 'Article liked' : 'Article unliked'
    });
    
  } catch (error) {
    next(error);
  }
};
