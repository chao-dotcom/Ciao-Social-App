import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IImage {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface ILike {
  username: string;
  timestamp: Date;
}

export interface IArticle extends Document {
  // Content
  text: string;
  
  // Media
  images: IImage[];
  
  // Author
  author: string;
  
  // Engagement
  likes: ILike[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  
  // Metadata
  editedAt?: Date;
  
  // Status
  isDeleted: boolean;
  
  // Optional: Content Classification
  hashtags: string[];
  mentions: string[];
  
  // Optional: Visibility
  visibility: 'public' | 'followers' | 'private';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>({
  // Content
  text: {
    type: String,
    required: true,
    maxlength: 5000
  },
  
  // Media
  images: [{
    url: String,
    publicId: String, // Cloudinary public ID for deletion
    width: Number,
    height: Number,
    format: String
  }],
  
  // Author
  author: {
    type: String, // username
    required: true,
    ref: 'User',
    index: true
  },
  
  // Engagement
  likes: [{
    username: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  
  commentsCount: {
    type: Number,
    default: 0
  },
  
  sharesCount: {
    type: Number,
    default: 0
  },
  
  // Metadata
  editedAt: Date,
  
  // Status
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  // Optional: Content Classification
  hashtags: [String],
  mentions: [String],
  
  // Optional: Visibility
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
ArticleSchema.index({ author: 1, createdAt: -1 });
ArticleSchema.index({ createdAt: -1 });
ArticleSchema.index({ hashtags: 1 });
ArticleSchema.index({ author: 1, isDeleted: 1, createdAt: -1 });

const Article: Model<IArticle> = mongoose.model<IArticle>('Article', ArticleSchema);

export default Article;
