const User = require('../models/User');
const Article = require('../models/Article');
const Comment = require('../models/Comment');
const bcrypt = require('bcrypt');
const { cloudinary } = require('../config/cloudinary');

// Search users by display name or username
exports.searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        data: { users: [] }
      });
    }
    
    const searchQuery = q.trim();
    
    // Search by display name or username (case-insensitive)
    const users = await User.find({
      $or: [
        { displayName: { $regex: searchQuery, $options: 'i' } },
        { username: { $regex: searchQuery, $options: 'i' } }
      ],
      isActive: true
    })
    .select('username displayName avatar bio followersCount followingCount')
    .limit(20);
    
    // Add following status if user is authenticated
    let enrichedUsers = users.map(u => u.toObject());
    
    if (req.user) {
      const currentUser = await User.findOne({ username: req.user.username });
      enrichedUsers = enrichedUsers.map(user => ({
        ...user,
        isFollowing: currentUser.following.includes(user.username),
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0
      }));
    }
    
    res.json({
      success: true,
      data: { users: enrichedUsers }
    });
    
  } catch (error) {
    next(error);
  }
};

// Get user profile
exports.getProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username });
    
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    
    // Add additional stats
    const profile = user.toObject();
    profile.followersCount = user.followers.length;
    profile.followingCount = user.following.length;
    
    // Check if current user is following this user
    if (req.user) {
      const currentUser = await User.findOne({ username: req.user.username });
      profile.isFollowing = currentUser.following.includes(username);
    }
    
    res.json({
      success: true,
      data: { user: profile }
    });
    
  } catch (error) {
    next(error);
  }
};

// Get headline for a user (or current user if not specified)
exports.getHeadline = async (req, res, next) => {
  try {
    const username = req.params.username || (req.user && req.user.username);

    if (!username) {
      return res.status(400).json({ success: false, error: { message: 'Username required' } });
    }

    const user = await User.findOne({ username }).select('username displayName bio headline');

    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }

    res.json({ success: true, data: { username: user.username, headline: user.headline || '' } });
  } catch (error) {
    next(error);
  }
};

// Update headline for current logged-in user
exports.updateHeadline = async (req, res, next) => {
  try {
    if (!req.user || !req.user.username) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    }

    const { headline } = req.body;

    if (headline === undefined) {
      return res.status(400).json({ success: false, error: { message: 'Headline required' } });
    }

    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }

    user.headline = headline;
    await user.save();

    res.json({ success: true, data: { username: user.username, headline: user.headline } });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    
    // Check if user is updating their own profile
    if (req.user.username !== username) {
      return res.status(403).json({
        success: false,
        error: { message: 'You can only update your own profile' }
      });
    }
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    
    // Update allowed fields
    const allowedFields = ['displayName', 'bio', 'location', 'phoneNumber', 'dateOfBirth'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });
    
    // Update settings if provided
    if (req.body.settings) {
      user.settings = { ...user.settings, ...req.body.settings };
    }
    
    await user.save();
    
    res.json({
      success: true,
      data: { user },
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// Update avatar
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' }
      });
    }
    
    const user = await User.findOne({ username: req.user.username });
    
    // Delete old avatar from Cloudinary if it exists and is not default
    if (user.avatar && user.avatar.includes('cloudinary.com') && user.avatar.includes('avatars/')) {
      try {
        const publicIdMatch = user.avatar.match(/avatars\/[^/]+/);
        if (publicIdMatch) {
          await cloudinary.uploader.destroy(publicIdMatch[0]);
        }
      } catch (err) {
        console.error('Failed to delete old avatar:', err);
      }
    }
    
    user.avatar = req.file.path;
    await user.save();
    
    res.json({
      success: true,
      data: { avatar: user.avatar },
      message: 'Avatar updated successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// Get followers
exports.getFollowers = async (req, res, next) => {
  try {
    const username = req.params.username || (req.user && req.user.username);
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    
    // Get full user objects for followers
    const followers = await User.find({
      username: { $in: user.followers }
    }).select('username displayName avatar bio');
    
    res.json({
      success: true,
      data: {
        followers,
        count: followers.length
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// Get following
exports.getFollowing = async (req, res, next) => {
  try {
    const username = req.params.username || (req.user && req.user.username);
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    
    // Get full user objects for following
    const following = await User.find({
      username: { $in: user.following }
    }).select('username displayName avatar bio');
    
    res.json({
      success: true,
      data: {
        following,
        count: following.length
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// Follow user
exports.followUser = async (req, res, next) => {
  try {
    const { username } = req.params;
    
    // Can't follow yourself
    if (req.user.username === username) {
      return res.status(400).json({
        success: false,
        error: { message: 'You cannot follow yourself' }
      });
    }
    
    const currentUser = await User.findOne({ username: req.user.username });
    const targetUser = await User.findOne({ username });
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    
    // Check if already following
    if (currentUser.following.includes(username)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Already following this user' }
      });
    }
    
    // Add to following/followers
    currentUser.following.push(username);
    targetUser.followers.push(req.user.username);
    
    await currentUser.save();
    await targetUser.save();
    
    res.json({
      success: true,
      message: `You are now following ${username}`
    });
    
  } catch (error) {
    next(error);
  }
};

// Unfollow user
exports.unfollowUser = async (req, res, next) => {
  try {
    const { username } = req.params;
    
    const currentUser = await User.findOne({ username: req.user.username });
    const targetUser = await User.findOne({ username });
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    
    // Check if following
    if (!currentUser.following.includes(username)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Not following this user' }
      });
    }
    
    // Remove from following/followers
    currentUser.following = currentUser.following.filter(u => u !== username);
    targetUser.followers = targetUser.followers.filter(u => u !== req.user.username);
    
    await currentUser.save();
    await targetUser.save();
    
    res.json({
      success: true,
      message: `You unfollowed ${username}`
    });
    
  } catch (error) {
    next(error);
  }
};

// Delete user account
exports.deleteAccount = async (req, res, next) => {
  try {
    const { username } = req.params;
    
    // Verify user is deleting their own account
    if (req.user.username !== username) {
      return res.status(403).json({
        success: false,
        error: { message: 'You can only delete your own account' }
      });
    }
    
    const user = await User.findOne({ username }).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    
    // For local auth, require password confirmation
    if (req.body.password && user.password) {
      const isMatch = await bcrypt.compare(req.body.password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: { message: 'Incorrect password' }
        });
      }
    }
    
    // Soft delete user (mark as inactive)
    user.isActive = false;
    user.email = `deleted_${user._id}@deleted.com`; // Anonymize email
    await user.save();
    
    // Remove user from other users' following/followers lists
    await User.updateMany(
      { following: username },
      { $pull: { following: username } }
    );
    
    await User.updateMany(
      { followers: username },
      { $pull: { followers: username } }
    );
    
    // Soft delete all user's articles
    await Article.updateMany(
      { author: username },
      { isDeleted: true }
    );
    
    // Soft delete all user's comments
    await Comment.updateMany(
      { author: username },
      { isDeleted: true }
    );
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// New: get display name
exports.getDisplay = async (req, res, next) => {
  try {
    const username = req.params.username || (req.user && req.user.username);
    if (!username) return res.status(400).json({ success: false, error: { message: 'Username required' } });
    const user = await User.findOne({ username }).select('username displayName');
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    res.json({ success: true, data: { username: user.username, displayName: user.displayName } });
  } catch (err) { next(err); }
};

exports.updateDisplay = async (req, res, next) => {
  try {
    if (!req.user || !req.user.username) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    const { displayName } = req.body;
    if (displayName === undefined) return res.status(400).json({ success: false, error: { message: 'displayName required' } });
    const user = await User.findOne({ username: req.user.username });
    user.displayName = displayName;
    await user.save();
    res.json({ success: true, data: { username: user.username, displayName: user.displayName } });
  } catch (err) { next(err); }
};

// Email
exports.getEmail = async (req, res, next) => {
  try {
    const username = req.params.username || (req.user && req.user.username);
    if (!username) return res.status(400).json({ success: false, error: { message: 'Username required' } });
    const user = await User.findOne({ username }).select('username email');
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    res.json({ success: true, data: { username: user.username, email: user.email } });
  } catch (err) { next(err); }
};

exports.updateEmail = async (req, res, next) => {
  try {
    if (!req.user || !req.user.username) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: { message: 'Email required' } });
    const user = await User.findOne({ username: req.user.username });
    user.email = email;
    await user.save();
    res.json({ success: true, data: { username: user.username, email: user.email } });
  } catch (err) { next(err); }
};

// DOB
exports.getDob = async (req, res, next) => {
  try {
    if (!req.user || !req.user.username) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    const user = await User.findOne({ username: req.user.username }).select('username dateOfBirth');
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    res.json({ success: true, data: { username: user.username, dob: user.dateOfBirth } });
  } catch (err) { next(err); }
};

// Zipcode
exports.getZipcode = async (req, res, next) => {
  try {
    const username = req.params.username || (req.user && req.user.username);
    if (!username) return res.status(400).json({ success: false, error: { message: 'Username required' } });
    const user = await User.findOne({ username }).select('username zipcode');
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    res.json({ success: true, data: { username: user.username, zipcode: user.zipcode } });
  } catch (err) { next(err); }
};

exports.updateZipcode = async (req, res, next) => {
  try {
    if (!req.user || !req.user.username) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    const { zipcode } = req.body;
    if (!zipcode) return res.status(400).json({ success: false, error: { message: 'Zipcode required' } });
    const user = await User.findOne({ username: req.user.username });
    user.zipcode = zipcode;
    await user.save();
    res.json({ success: true, data: { username: user.username, zipcode: user.zipcode } });
  } catch (err) { next(err); }
};

// Phone
exports.getPhone = async (req, res, next) => {
  try {
    const username = req.params.username || (req.user && req.user.username);
    if (!username) return res.status(400).json({ success: false, error: { message: 'Username required' } });
    const user = await User.findOne({ username }).select('username phoneNumber');
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    res.json({ success: true, data: { username: user.username, phone: user.phoneNumber } });
  } catch (err) { next(err); }
};

exports.updatePhone = async (req, res, next) => {
  try {
    if (!req.user || !req.user.username) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: { message: 'Phone required' } });
    const user = await User.findOne({ username: req.user.username });
    user.phoneNumber = phone;
    await user.save();
    res.json({ success: true, data: { username: user.username, phone: user.phoneNumber } });
  } catch (err) { next(err); }
};

// Avatar getter
exports.getAvatar = async (req, res, next) => {
  try {
    const username = req.params.username || (req.user && req.user.username);
    if (!username) return res.status(400).json({ success: false, error: { message: 'Username required' } });
    const user = await User.findOne({ username }).select('username avatar');
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    res.json({ success: true, data: { username: user.username, avatar: user.avatar } });
  } catch (err) { next(err); }
};

