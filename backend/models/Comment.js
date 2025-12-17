const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  // Association
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
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
    type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model('Comment', CommentSchema);

