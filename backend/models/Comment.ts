import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICommentLike {
  username: string;
  timestamp: Date;
}

export interface IComment extends Document {
  // Association
  articleId: Types.ObjectId;
  
  // Content
  text: string;
  
  // Author
  author: string;
  
  // Threading (Optional: for nested comments)
  parentCommentId?: Types.ObjectId;
  
  // Engagement
  likes: ICommentLike[];
  likesCount: number;
  
  // Metadata
  editedAt?: Date;
  isDeleted: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  // Association
  articleId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Article',
    index: true
  },
  
  // Content
  text: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Author
  author: {
    type: String, // username
    required: true,
    ref: 'User'
  },
  
  // Threading (Optional: for nested comments)
  parentCommentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
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
  
  // Metadata
  editedAt: Date,
  
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
CommentSchema.index({ articleId: 1, createdAt: -1 });
CommentSchema.index({ author: 1, createdAt: -1 });

const Comment: Model<IComment> = mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
