import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import passport from './config/passport';

// Optional security packages
let mongoSanitize: any, xss: any;
try {
  mongoSanitize = require('express-mongo-sanitize');
  xss = require('xss-clean');
} catch (e) {
  console.warn('⚠️  Optional security packages not installed. Run: npm install express-mongo-sanitize xss-clean');
}

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (required for Heroku to get correct protocol)
app.set('trust proxy', 1);

// Database connection
const connectDB = async (): Promise<void> => {
  try {
    const options = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      retryReads: true,
    };
    
    await mongoose.connect(process.env.MONGODB_URI as string, options);
    console.log('✅ MongoDB connected');
  } catch (err: any) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.googleusercontent.com"],
    },
  },
}));

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL?.replace(/\/$/, ''),
      'http://localhost:3001',
      'http://localhost:3000'
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
};

app.use(cors(corsOptions));

console.log('🌐 CORS config:', {
  frontendUrl: process.env.FRONTEND_URL,
  credentials: true,
  allowedMethods: corsOptions.methods
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Data sanitization (if packages installed)
if (mongoSanitize) {
  app.use(mongoSanitize());
  console.log('✅ NoSQL injection protection enabled');
}

if (xss) {
  app.use(xss());
  console.log('✅ XSS protection enabled');
}

// Session configuration
const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'PRODUCTION';
app.use(session({
  secret: process.env.SESSION_SECRET as string,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI as string,
    ttl: 24 * 60 * 60
  }),
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: isProduction ? 'none' : 'lax'
  }
}));

console.log('🍪 Session cookie config:', {
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  httpOnly: true,
  environment: process.env.NODE_ENV
});

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Social Media API',
    version: '1.0.0',
    status: 'running'
  });
});

// Authentication routes
import authRoutes from './routes/auth';
app.use('/auth', authRoutes);

// Resource routes
import avatarRoutes from './routes/avatar';
import articleRoutes from './routes/article';
import articlesRoutes from './routes/articles';
import usersRoutes from './routes/users';
import commentsRoutes from './routes/comments';
import followingRoutes from './routes/following';
import headlineRoutes from './routes/headline';
import profileRoutes from './routes/profile';

app.use('/avatar', avatarRoutes);
app.use('/article', articleRoutes);
app.use('/articles', articlesRoutes);
app.use('/users', usersRoutes);
app.use('/comments', commentsRoutes);
app.use('/following', followingRoutes);
app.use('/headline', headlineRoutes);
app.use('/profile', profileRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found'
    }
  });
});

// Error handler
interface CustomError extends Error {
  statusCode?: number;
}

app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Start server after database connection
const startServer = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  });
};

// Only start server automatically when run directly
if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
