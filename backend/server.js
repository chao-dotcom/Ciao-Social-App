require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const passport = require('./config/passport');

// Optional security packages (install with: npm install express-mongo-sanitize xss-clean)
let mongoSanitize, xss;
try {
  mongoSanitize = require('express-mongo-sanitize');
  xss = require('xss-clean');
} catch (e) {
  console.warn('⚠️  Optional security packages not installed. Run: npm install express-mongo-sanitize xss-clean');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (required for Heroku to get correct protocol)
// This ensures req.protocol returns 'https' when behind Heroku's proxy
app.set('trust proxy', 1);

// Database connection
const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 30000, // Increase to 30s for replica set discovery
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      retryReads: true,
    };
    
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅ MongoDB connected');
  } catch (err) {
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
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL?.replace(/\/$/, ''), // Remove trailing slash
      'http://localhost:3001',
      'http://localhost:3000'
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // REQUIRED for cookies to be sent cross-origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

console.log('🌐 CORS config:', {
  frontendUrl: process.env.FRONTEND_URL,
  credentials: true,
  allowedMethods: corsOptions.methods
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
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
// For Google OAuth to work with cross-site redirects (Google → Backend → Frontend),
// we MUST use sameSite: 'none' and secure: true in production
const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'PRODUCTION';
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    secure: isProduction, // Must be true for HTTPS (required when sameSite: 'none')
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: isProduction ? 'none' : 'lax' // 'none' required for cross-site OAuth redirects
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
app.get('/', (req, res) => {
  res.json({
    message: 'Social Media API',
    version: '1.0.0',
    status: 'running'
  });
});

// Authentication routes
app.use('/auth', require('./routes/auth'));

// Resource routes
app.use('/avatar', require('./routes/avatar')); // PUT /avatar
app.use('/article', require('./routes/article')); // POST /article (create)
app.use('/articles', require('./routes/articles')); // GET /articles (read/update/delete)
app.use('/users', require('./routes/users'));
app.use('/comments', require('./routes/comments'));
app.use('/following', require('./routes/following'));
// Headline endpoints required by assignment
app.use('/headline', require('./routes/headline'));
// Profile endpoints (display, email, dob, zipcode, phone)
app.use('/profile', require('./routes/profile'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
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
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  });
};

// Only start server automatically when run directly (enables tests to require the app)
if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = app;

