const { body, validationResult, param, query } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }
  next();
};

// Registration validation
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 }),
  validate
];

// Login validation
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

// Article validation
const validateArticle = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Article text is required')
    .isLength({ max: 5000 })
    .withMessage('Article text must not exceed 5000 characters'),
  validate
];

// Comment validation
const validateComment = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ max: 1000 })
    .withMessage('Comment text must not exceed 1000 characters'),
  validate
];

// Profile update validation
const validateProfileUpdate = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 }),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  body('phoneNumber')
    .optional()
    .trim()
    .isMobilePhone(),
  body('dateOfBirth')
    .optional()
    .isISO8601(),
  validate
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  validate
];

// Username parameter validation
const validateUsername = [
  param('username')
    .trim()
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Invalid username format'),
  validate
];

module.exports = {
  validate,
  validateRegistration,
  validateLogin,
  validateArticle,
  validateComment,
  validateProfileUpdate,
  validatePagination,
  validateUsername
};

