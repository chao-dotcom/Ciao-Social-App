## Live Demo

- **Frontend**: https://chao-com.surge.sh
- **Backend API**: https://ricebook-ch218.herokuapp.com

## Test Account

- **Username**: testuser
- **Password**: Test123!

# Backend — Ciao API (Node / Express)

This folder contains the backend API for the Ciao social app. It provides all authentication, user, article, comment, following, and media upload endpoints used by the frontend.

This README explains how to run, test and deploy the backend. The frontend README (in `/frontend`) describes the client.

Quick Start (development)
1. Install dependencies

```bash
cd backend
npm install
```

2. Create `.env` from the example

```bash
cp .env.example .env
# edit .env to set MONGODB_URI, CLOUDINARY_* and OAuth keys
```

3. Start the development server

```bash
npm run dev
```

The API will be available at `http://localhost:3000` (or the `PORT` you set).

Scripts
- `npm start` — start the server (production)
- `npm run dev` — start server with `nodemon` for development
- `npm test` — run backend tests (Jest + supertest)
- `npm run lint` — run linter (if configured)

Environment Variables

See `backend/.env.example` for a full list. Key variables include:

- `NODE_ENV` — `development` or `production`
- `PORT` — port to run the API (default 3000)
- `MONGODB_URI` — MongoDB connection string (Atlas recommended)
- `SESSION_SECRET` — secret for express-session
- `JWT_SECRET` — secret for JWT tokens
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Cloudinary credentials
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` — Google OAuth
- `FRONTEND_URL` — the frontend origin (for redirects/CORS)

API Endpoints (high level)

Authentication
- `POST /auth/register` — register
- `POST /auth/login` — login
- `GET /auth/logout` — logout
- `GET /auth/google` — start Google OAuth
- `GET /auth/google/callback` — Google OAuth callback
- `POST /auth/link` — link an OAuth provider to current user
- `DELETE /auth/unlink/:provider` — unlink provider

Users
- `GET /users/:username` — get profile
- `PUT /users/:username` — update profile
- `PUT /avatar` or `PUT /users/:username/avatar` — upload/update avatar
- `GET /users/:username/followers` — list followers
- `GET /users/:username/following` — list following
- `GET /users/search?q=...` — search users by displayName or username

Articles
- `GET /articles` — feed (supports `?page=1&limit=10`)
- `GET /articles/:id` — get article
- `GET /articles/user/:username` — articles by author
- `POST /article` — create article (supports images via multipart)
- `PUT /articles/:id` — update article
- `DELETE /articles/:id` — delete article
- `PUT /articles/:id/like` — toggle like

Comments
- `GET /comments/article/:articleId` — get comments
- `POST /comments/article/:articleId` — create comment
- `PUT /comments/:id` — update comment
- `DELETE /comments/:id` — delete comment

Following
- `PUT /following/:username` — follow user
- `DELETE /following/:username` — unfollow user

Media Uploads
- Cloudinary is used for persistent image storage. Multer + `multer-storage-cloudinary` is configured in `backend/config/cloudinary.js`.
- Avatars use the `uploadAvatar` middleware (`single('avatar')`)
- Article images use the `uploadArticleImages` middleware (`array('images', 4)`)

Testing

- Unit and integration tests use Jest and supertest.

```bash
cd backend
npm test
```

Deployment (Heroku)

1. Ensure your Heroku app exists and you are logged in:

```bash
heroku login
heroku create your-app-name
```

2. Add required config vars to Heroku (do not commit secrets):

```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="<your_mongo_uri>"
heroku config:set SESSION_SECRET="<random_string>"
heroku config:set JWT_SECRET="<random_string>"
heroku config:set CLOUDINARY_CLOUD_NAME="..."
heroku config:set CLOUDINARY_API_KEY="..."
heroku config:set CLOUDINARY_API_SECRET="..."
heroku config:set GOOGLE_CLIENT_ID="..."
heroku config:set GOOGLE_CLIENT_SECRET="..."
heroku config:set FRONTEND_URL="https://your-frontend.surge.sh"
```

3. Push to Heroku

```bash
git push heroku master
```

Notes & Troubleshooting

- Do not commit any `.env` files or secrets to source control. Use `backend/.env.example` as a template.
- If Google OAuth returns 403 or redirect errors, verify the OAuth callback URL in Google Cloud Console matches `GOOGLE_CALLBACK_URL` and your Heroku domain.
- If images fail to upload, check Cloudinary credentials and that `CLOUDINARY_*` env vars are set.
- Sessions are stored in MongoDB using `connect-mongo`; confirm the `MONGODB_URI` is reachable and allowed by your Atlas network settings.

Where to look in the code

- `server.js` — application entry and middleware setup
- `config/cloudinary.js` — Cloudinary + Multer storage configuration
- `config/passport.js` — Passport Google OAuth configuration
- `controllers/` — business logic for auth, users, articles, comments
- `routes/` — route wiring for the API
- `models/` — Mongoose schemas (User, Article, Comment)
- `middleware/` — auth, validation, and helpers

License

This project is for educational purposes (COMP 531 course).