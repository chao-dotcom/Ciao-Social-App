const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Check if user is authenticated
const isAuthenticated = async (req, res, next) => {
  // Check session first
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  
  // Check for JWT token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch full user object from database using userId from token
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { message: 'User not found' }
        });
      }
      
      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired token' }
      });
    }
  }
  
  return res.status(401).json({
    success: false,
    error: { message: 'Authentication required' }
  });
};

// Check if user is the owner of a resource
const isOwner = (Model) => {
  return async (req, res, next) => {
    try {
      const resource = await Model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: { message: 'Resource not found' }
        });
      }
      
      if (resource.author !== req.user.username) {
        return res.status(403).json({
          success: false,
          error: { message: 'Unauthorized: You do not own this resource' }
        });
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Optional authentication (doesn't fail if not authenticated)
const optionalAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // If token uses standard { userId } payload, fetch the full user
      if (decoded && decoded.userId) {
        // do not block on DB errors; optionalAuth should be non-fatal
        User.findById(decoded.userId).then((user) => {
          if (user) req.user = user;
        }).catch(() => {
          // ignore
        });
      } else {
        req.user = decoded;
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }
  }
  
  next();
};

module.exports = {
  isAuthenticated,
  isOwner,
  optionalAuth
};

