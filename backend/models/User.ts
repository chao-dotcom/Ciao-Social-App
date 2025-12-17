import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuthProvider {
  provider: 'local' | 'google' | 'facebook' | 'twitter' | 'github';
  providerId?: string;
  email?: string;
  linkedAt: Date;
}

export interface IUserSettings {
  isPrivate: boolean;
  allowMessagesFromNonFollowers: boolean;
  emailNotifications: boolean;
}

export interface IUser extends Document {
  // Basic Authentication
  username: string;
  email: string;
  password?: string;
  salt?: string;
  
  // Profile Information
  displayName: string;
  headline: string;
  avatar: string;
  bio: string;
  location?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
  zipcode?: string;
  
  // Social Graph
  following: string[];
  followers: string[];
  
  // OAuth Integration
  authProviders: IAuthProvider[];
  
  // Account Metadata
  lastLoginAt?: Date;
  isActive: boolean;
  isVerified: boolean;
  
  // Privacy & Settings
  settings: IUserSettings;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  toJSON(): any;
}

const UserSchema = new Schema<IUser>({
  // Basic Authentication
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
  },
  password: {
    type: String,
    select: false // Don't return by default
  },
  salt: {
    type: String,
    select: false
  },
  
  // Profile Information
  displayName: {
    type: String,
    default: function(this: IUser) { return this.username; }
  },
  headline: {
    type: String,
    maxlength: 160,
    default: ''
  },
  avatar: {
    type: String,
    default: 'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg'
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  location: String,
  dateOfBirth: Date,
  phoneNumber: {
    type: String,
    trim: true,
    maxlength: 20,
    match: /^[\d+\-\s()]{7,20}$/
  },
  zipcode: {
    type: String,
    trim: true,
    maxlength: 10,
    match: /^\d{5}(?:-\d{4})?$/
  },
  
  // Social Graph
  following: [{
    type: String, // usernames
    ref: 'User'
  }],
  followers: [{
    type: String,
    ref: 'User'
  }],
  
  // OAuth Integration
  authProviders: [{
    provider: {
      type: String,
      enum: ['local', 'google', 'facebook', 'twitter', 'github']
    },
    providerId: String,
    email: String,
    linkedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Account Metadata
  lastLoginAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Privacy & Settings
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    allowMessagesFromNonFollowers: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ 'authProviders.provider': 1, 'authProviders.providerId': 1 });

// Instance methods
UserSchema.methods.toJSON = function(this: IUser) {
  const obj = this.toObject();
  delete obj.password;
  delete obj.salt;
  return obj;
};

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
