const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
// Only configure if credentials are provided (allows app to run without OAuth)
const hasGoogleCreds = process.env.GOOGLE_CLIENT_ID && 
                       process.env.GOOGLE_CLIENT_SECRET && 
                       process.env.GOOGLE_CLIENT_ID !== '' && 
                       process.env.GOOGLE_CLIENT_SECRET !== '';

if (hasGoogleCreds) {
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:3000'}/auth/google/callback`;
  
  // Log callback URL for debugging (remove in production if sensitive)
  console.log('🔐 Google OAuth Callback URL:', callbackURL);
  
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
      proxy: true, // Required for Heroku - tells passport to trust the proxy
      passReqToCallback: false,
      state: true // Enable state parameter for CSRF protection and preventing replay
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('✅ TOKEN EXCHANGE SUCCEEDED!', {
          id: profile.id,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value,
          hasEmails: !!profile.emails?.length
        });
        
        // Check if user exists with this Google ID
        let user = await User.findOne({
          'authProviders.provider': 'google',
          'authProviders.providerId': profile.id
        });
        
        if (user) {
          console.log('✅ Google OAuth - Existing user found by Google ID:', user.username);
          // Update last login
          user.lastLoginAt = new Date();
          await user.save();
          return done(null, user);
        }
        
        // Check if email exists
        const email = profile.emails?.[0]?.value;
        if (!email) {
          console.error('❌ Google OAuth - No email in profile');
          return done(new Error('No email provided by Google'), null);
        }
        
        console.log('🔍 Google OAuth - Checking for existing email:', email);
        user = await User.findOne({ email });
        
        if (user) {
          // Email exists but not linked - automatically link it
          console.log('⚠️ Google OAuth - Email exists but not linked. Linking account...', {
            existingUsername: user.username,
            googleId: profile.id
          });
          
          // Check if Google provider already exists
          const hasGoogleProvider = user.authProviders.some(
            p => p.provider === 'google' && p.providerId === profile.id
          );
          
          if (!hasGoogleProvider) {
            // Add Google provider to existing user
            user.authProviders.push({
              provider: 'google',
              providerId: profile.id,
              email: email
            });
            
            // Update avatar if not set
            if (!user.avatar && profile.photos?.[0]?.value) {
              user.avatar = profile.photos[0].value;
            }
            
            // Update display name if not set
            if (!user.displayName && profile.displayName) {
              user.displayName = profile.displayName;
            }
            
            user.lastLoginAt = new Date();
            await user.save();
            console.log('✅ Google OAuth - Account linked successfully');
          }
          
          return done(null, user);
        }
        
        // Create new user
        console.log('🆕 Google OAuth - Creating new user...');
        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
        let username = baseUsername;
        let counter = 1;
        
        // Ensure unique username
        while (await User.findOne({ username })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }
        
        console.log('🆕 Google OAuth - Generated username:', username);
        
        user = new User({
          username,
          email,
          displayName: profile.displayName || username,
          avatar: profile.photos?.[0]?.value || undefined,
          isVerified: profile.emails?.[0]?.verified || true,
          authProviders: [{
            provider: 'google',
            providerId: profile.id,
            email: email
          }],
          lastLoginAt: new Date()
        });
        
        await user.save();
        console.log('✅ Google OAuth - New user created:', username);
        done(null, user);
        
      } catch (error) {
        console.error('❌ Google OAuth Strategy Error:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        done(error, null);
      }
    }
  ));
}

module.exports = passport;

