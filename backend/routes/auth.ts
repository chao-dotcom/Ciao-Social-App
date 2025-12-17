import express, { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import passport from '../config/passport';
import * as authController from '../controllers/authController';
import { isAuthenticated } from '../middleware/auth';
import { validateRegistration, validateLogin } from '../middleware/validation';

const router: Router = express.Router();

// Local authentication
router.post('/register', validateRegistration as any, authController.register);
router.post('/login', validateLogin as any, authController.login);
router.get('/logout', authController.logout);
// Also support PUT /logout as per assignment spec
router.put('/logout', authController.logout);
// Change password
router.put('/password', isAuthenticated, authController.changePassword);
router.get('/me', isAuthenticated, authController.getCurrentUser);

// Google OAuth
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

// Google OAuth - Callback 
router.get('/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    console.log('📍 Google callback received');
    console.log('Query code present:', !!req.query.code);
    console.log('Session ID:', req.sessionID);
    console.log('User agent:', req.get('User-Agent'));
    
    // Prevent browser caching of this endpoint
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    next();
  },
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=oauth_failed`,
    session: true
  }),
  (req: Request, res: Response) => {
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=no_user`);
    }

    // Generate JWT token for the authenticated user
    const token = jwt.sign(
      { userId: (req.user as any)._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    // Explicitly save session before redirect
    req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=session_error`);
      }
      console.log('✅ Session saved, redirecting to OAuth callback with token');
      // Redirect to OAuth callback page with JWT token
      res.redirect(303, `${process.env.FRONTEND_URL || 'http://localhost:3001'}/oauth/callback?token=${token}`);
    });
  }
);

// Account linking
router.post('/link', isAuthenticated, authController.linkOAuthAccount);
router.delete('/unlink/:provider', isAuthenticated, authController.unlinkOAuthAccount);

export default router;
