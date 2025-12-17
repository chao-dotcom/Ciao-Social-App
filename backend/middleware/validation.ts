import { Request, Response, NextFunction } from 'express';
import { body, validationResult, param, query, ValidationChain } from 'express-validator';

// Middleware to check validation results
export const validate = (req: Request, res: Response, next: NextFunction): void | Response => {
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
export const validateRegistration: ValidationChain[] = [
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
  validate as any
];

// Login validation
export const validateLogin: ValidationChain[] = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate as any
];

// Article validation
export const validateArticle: ValidationChain[] = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Article text is required')
    .isLength({ max: 5000 })
    .withMessage('Article text must not exceed 5000 characters'),
  validate as any
];

// Comment validation
export const validateComment: ValidationChain[] = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ max: 1000 })
    .withMessage('Comment text must not exceed 1000 characters'),
  validate as any
];

// Profile update validation
export const validateProfileUpdate: ValidationChain[] = [
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
  validate as any
];

// Pagination validation
export const validatePagination: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  validate as any
];

// Username parameter validation
export const validateUsername: ValidationChain[] = [
  param('username')
    .trim()
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Invalid username format'),
  validate as any
];
