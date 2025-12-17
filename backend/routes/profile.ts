import express, { Router } from 'express';
import { isAuthenticated, optionalAuth } from '../middleware/auth';
import * as userController from '../controllers/userController';

const router: Router = express.Router();

// Display name
router.get('/display/:username?', optionalAuth, userController.getDisplay);
router.put('/display', isAuthenticated, userController.updateDisplay);

// Email
router.get('/email/:username?', isAuthenticated, userController.getEmail);
router.put('/email', isAuthenticated, userController.updateEmail);

// DOB (only GET for current user)
router.get('/dob', isAuthenticated, userController.getDob);

// Zipcode
router.get('/zipcode/:username?', isAuthenticated, userController.getZipcode);
router.put('/zipcode', isAuthenticated, userController.updateZipcode);

// Phone
router.get('/phone/:username?', isAuthenticated, userController.getPhone);
router.put('/phone', isAuthenticated, userController.updatePhone);

export default router;
