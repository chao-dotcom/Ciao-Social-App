const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Article = require('../models/Article');
const Comment = require('../models/Comment');

// Register new user
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;
    
    console.log('📝 Registration attempt:', {
      username,
      email,
      hasPassword: !!password,
      passwordLength: password?.length,
      timestamp: new Date().toISOString()
    });
    
    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    
    if (existingUser) {
      console.log('❌ Registration failed - User already exists:', {
        username: existingUser.username,
        email: existingUser.email,
        requestedUsername: username,
        requestedEmail: email
      });
      return res.status(409).json({
        success: false,
        error: { message: 'Username or email already exists' }
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      salt,
      displayName: displayName || username,
      authProviders: [{
        provider: 'local',
        providerId: username,
        email
      }]
    });
    
    await user.save();
    console.log('✅ Registration successful - User created:', username);
    
    // Create session
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email
    };
    
    // Generate JWT token (standard payload: userId)
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        token
      },
      message: 'User registered successfully'
    });
    
  } catch (error) {
    console.error('❌ Registration error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    // Debug logging
    console.log('🔐 Login attempt:', {
      username,
      hasPassword: !!password,
      passwordLength: password?.length,
      timestamp: new Date().toISOString()
    });
    
    // Find user (include password field)
    const user = await User.findOne({ username }).select('+password');
    
    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }
    
    console.log('✅ User found:', {
      username: user.username,
      hasPassword: !!user.password,
      hasAuthProviders: user.authProviders?.length || 0
    });
    
    // Check if password exists (OAuth users won't have password)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        error: { message: 'Please login with OAuth provider' }
      });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', username);
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }
    
    console.log('✅ Password verified for user:', username);
    
    // Update last login
    user.lastLoginAt = new Date();
    await user.save();
    
    // Create session
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email
    };
    
    // Generate JWT token (standard payload: userId)
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        token
      },
      message: 'Login successful'
    });
    
  } catch (error) {
    next(error);
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to logout' }
      });
    }
    
    res.clearCookie('connect.sid');
    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
};

// Change password for logged-in user
exports.changePassword = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id && !req.user._id) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    }

    const userId = req.user.id || req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ success: false, error: { message: 'New password must be at least 8 characters' } });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }

    // If user has a password, require oldPassword
    if (user.password) {
      if (!oldPassword) {
        return res.status(400).json({ success: false, error: { message: 'Old password required' } });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: { message: 'Incorrect old password' } });
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.salt = salt;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    
    res.json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    next(error);
  }
};

// Link OAuth account
exports.linkOAuthAccount = async (req, res, next) => {
  try {
    const currentUser = await User.findOne({ username: req.user.username });
    const { provider, providerId, email } = req.body;
    
    // Check if this OAuth account is already linked to another user
    const existingOAuthUser = await User.findOne({
      'authProviders.provider': provider,
      'authProviders.providerId': providerId
    });
    
    if (existingOAuthUser && existingOAuthUser._id.toString() !== currentUser._id.toString()) {
      // OAuth account linked to different user - merge accounts
      
      // Merge following/followers
      currentUser.following = [...new Set([
        ...currentUser.following,
        ...existingOAuthUser.following
      ])];
      
      // Merge auth providers
      existingOAuthUser.authProviders.forEach(provider => {
        const exists = currentUser.authProviders.some(
          p => p.provider === provider.provider && p.providerId === provider.providerId
        );
        if (!exists) {
          currentUser.authProviders.push(provider);
        }
      });
      
      // Update articles to point to current user
      await Article.updateMany(
        { author: existingOAuthUser.username },
        { author: currentUser.username }
      );
      
      // Update comments
      await Comment.updateMany(
        { author: existingOAuthUser.username },
        { author: currentUser.username }
      );
      
      // Delete old OAuth user
      await User.findByIdAndDelete(existingOAuthUser._id);
      
    } else {
      // Just link the OAuth provider
      const providerExists = currentUser.authProviders.some(
        p => p.provider === provider && p.providerId === providerId
      );
      
      if (!providerExists) {
        currentUser.authProviders.push({
          provider,
          providerId,
          email
        });
      }
    }
    
    await currentUser.save();
    
    res.json({
      success: true,
      data: { authProviders: currentUser.authProviders },
      message: 'Account linked successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// Unlink OAuth account
exports.unlinkOAuthAccount = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const user = await User.findOne({ username: req.user.username });
    
    // Ensure user has at least 2 auth providers or has a password
    const hasPassword = !!(await User.findById(user._id).select('+password')).password;
    
    if (user.authProviders.length <= 1 && !hasPassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot unlink only authentication method' }
      });
    }
    
    // Remove the provider
    user.authProviders = user.authProviders.filter(
      p => p.provider !== provider
    );
    
    await user.save();
    
    res.json({
      success: true,
      data: { authProviders: user.authProviders },
      message: 'Account unlinked successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

