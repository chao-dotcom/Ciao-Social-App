# Ciao Social App

[![Thumbnail](asset/thumbnail.png)](https://github.com/user-attachments/assets/dca2e240-e178-47b5-845a-857751ac9550)


## [Demo](https://github.com/user-attachments/assets/dca2e240-e178-47b5-845a-857751ac9550)

A full-stack social media application built with **TypeScript**, featuring React frontend and Express backend for posting articles, comments, and following users.

## Features

- ✅ **Full TypeScript** - Type-safe frontend and backend
- 📝 Post and edit articles with image uploads
- 💬 Comment on articles with nested discussions
- 👥 Follow users and view personalized feeds
- 🖼️ Avatar upload and profile management
- 🔐 JWT authentication + OAuth (Google)
- 🎨 Responsive React UI with modern design

## Tech Stack

### Backend (TypeScript + Node.js)
- Express.js with TypeScript
- MongoDB + Mongoose with typed schemas
- Passport.js (JWT + OAuth)
- Cloudinary for image storage
- Express validation & security middleware

### Frontend (TypeScript + React)
- React 18 with TypeScript
- React Router v6
- Axios with typed API clients
- Context API for state management
- CSS3 with responsive design

## Quick Start

### Backend

```bash
cd backend
npm install
npm run build    # Compile TypeScript
npm start        # Run compiled JS
# or for development:
npm run dev      # Run with ts-node + nodemon
```

### Frontend

```bash
cd frontend
npm install
npm start        # Development server with TypeScript
npm run build    # Production build
```

### Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

**Backend `.env`:**
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
FRONTEND_URL=http://localhost:3001
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Frontend `.env`:**
```env
REACT_APP_API_URL=http://localhost:3000
```

## Project Structure

```
├── backend/                 # TypeScript Express API
│   ├── config/             # Cloudinary, Passport configs (.ts)
│   ├── controllers/        # Route controllers (.ts)
│   ├── middleware/         # Auth, validation middleware (.ts)
│   ├── models/             # Mongoose models with TypeScript interfaces
│   ├── routes/             # Express routes (.ts)
│   ├── server.ts           # Main server file
│   ├── tsconfig.json       # TypeScript configuration
│   └── package.json        # Dependencies + build scripts
│
├── frontend/               # TypeScript React app
│   ├── src/
│   │   ├── api/           # Typed API clients (.ts)
│   │   ├── components/    # React components (.tsx)
│   │   ├── context/       # Auth context (.tsx)
│   │   ├── pages/         # Route pages (.tsx)
│   │   ├── App.tsx        # Main app component
│   │   └── index.tsx      # Entry point
│   ├── tsconfig.json      # TypeScript configuration
│   └── package.json       # Dependencies
│
└── asset/                 # Static assets
    └── thumbnail.png      # Project thumbnail
```

## TypeScript Benefits

This project has been **100% migrated to TypeScript** - all JavaScript files removed!

### Migration Statistics
- ✅ **Backend**: 22 TypeScript files (.ts)
- ✅ **Frontend**: 23 TypeScript files (.ts + .tsx)
- ✅ **0 JavaScript files** remaining (all .js/.jsx deleted)

### Why TypeScript?

- 🔒 **Type Safety** - Catch errors at compile-time, not runtime
- 📖 **Better Documentation** - Interfaces serve as inline documentation
- 🚀 **Improved DX** - IntelliSense and autocomplete in your IDE
- 🐛 **Fewer Bugs** - Prevent common JavaScript errors
- 🔧 **Easier Refactoring** - Rename/move code with confidence

### Key TypeScript Features

- **Backend**: Typed Express middleware, Mongoose models with interfaces, type-safe controllers
- **Frontend**: Typed React components, API client with response types, Context API with types
- **Shared Types**: Consistent data structures across frontend and backend
- **Test Suite**: Jest with ts-jest for TypeScript test files

## Contributing

Open an issue or submit a PR.

## License

MIT
