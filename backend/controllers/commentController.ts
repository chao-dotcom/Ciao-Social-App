import { Request, Response, NextFunction } from 'express';
import Comment, { IComment } from '../models/Comment';
import Article from '../models/Article';
import User from '../models/User';

// Extend Express Request to include user info
interface AuthRequest extends Request {
  user?: {
    username: string;
    [key: string]: any;
  };
  resource?: IComment;
}

// Get comments for an article
export const getComments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    // Support both /articles/:id/comments and /comments/article/:articleId
    const articleId = req.params.id || req.params.articleId;
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const comments = await Comment.find({
      articleId,
      isDeleted: false
    })
    .sort({ createdAt: 1 }) // Oldest first
    .skip(skip)
    .limit(limitNum)
    .lean();
    
    // Populate author details
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await User.findOne({ username: comment.author })
          .select('username displayName avatar');
        return {
          ...comment,
          authorDetails: author
        };
      })
    );
    
    const totalCount = await Comment.countDocuments({
      articleId,
      isDeleted: false
    });
    
    res.json({
      success: true,
      data: {
        comments: commentsWithAuthors,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          pageSize: limitNum,
          totalItems: totalCount
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// Create comment
export const createComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    // Support both /articles/:id/comments and /comments/article/:articleId
    const articleId = req.params.id || req.params.articleId;
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
        error: { message: 'Comment text is required' }
      });
    }
    
    // Check if article exists
    const article = await Article.findById(articleId);
    if (!article || article.isDeleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Article not found' }
      });
    }
    
    // Create comment
    const comment = new Comment({
      articleId,
      text,
      author: req.user.username
    });
    
    await comment.save();
    
    // Increment article comment count
    article.commentsCount += 1;
    await article.save();
    
    // Get author details
    const author = await User.findOne({ username: req.user.username })
      .select('username displayName avatar');
    
    res.status(201).json({
      success: true,
      data: {
        comment: {
          ...comment.toObject(),
          authorDetails: author
        }
      },
      message: 'Comment created successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// Update comment
export const updateComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { text } = req.body;
    const comment = req.resource; // Set by isOwner middleware
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Comment not found' }
      });
    }
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Comment text is required' }
      });
    }
    
    comment.text = text;
    comment.editedAt = new Date();
    await comment.save();
    
    // Get author details
    const author = await User.findOne({ username: comment.author })
      .select('username displayName avatar');
    
    res.json({
      success: true,
      data: {
        comment: {
          ...comment.toObject(),
          authorDetails: author
        }
      },
      message: 'Comment updated successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// Delete comment
export const deleteComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const comment = req.resource; // Set by isOwner middleware
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Comment not found' }
      });
    }
    
    // Soft delete
    comment.isDeleted = true;
    await comment.save();
    
    // Decrement article comment count
    const article = await Article.findById(comment.articleId);
    if (article) {
      article.commentsCount = Math.max(0, article.commentsCount - 1);
      await article.save();
    }
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// Toggle like on comment
export const toggleLike = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }
    
    const comment = await Comment.findById(req.params.id);
    
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Comment not found' }
      });
    }
    
    // Check if user already liked
    const likeIndex = comment.likes.findIndex(
      like => like.username === req.user!.username
    );
    
    if (likeIndex > -1) {
      // Unlike
      comment.likes.splice(likeIndex, 1);
      comment.likesCount = Math.max(0, comment.likesCount - 1);
    } else {
      // Like
      comment.likes.push({
        username: req.user.username,
        timestamp: new Date()
      });
      comment.likesCount += 1;
    }
    
    await comment.save();
    
    res.json({
      success: true,
      data: {
        liked: likeIndex === -1,
        likesCount: comment.likesCount
      },
      message: likeIndex === -1 ? 'Comment liked' : 'Comment unliked'
    });
    
  } catch (error) {
    next(error);
  }
};
