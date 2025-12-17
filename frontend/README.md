## Live Demo

- **Frontend**: https://chao-com.surge.sh
- **Backend API**: https://ricebook-ch218.herokuapp.com

## Test Account

- **Username**: testuser
- **Password**: Test123!

# Frontend — Ciao (React)

This folder contains the React frontend for the Ciao social app (built with Create React App).

This README covers how to run, build and deploy the frontend. The main app interacts with the backend API documented at the project root README.

Prerequisites
- Node.js v16+ and npm or yarn
- A running backend API (local or deployed) reachable from `REACT_APP_API_URL` (see below)

Quick Start (development)
1. Install dependencies

```bash
cd frontend
npm install
```

2. Create a local environment file (optional)

```bash
# from frontend/
cp .env.example .env
# Edit .env to set REACT_APP_API_URL if needed
```

3. Run the dev server

```bash
npm start
```

The app will open at `http://localhost:3000` (or another port if 3000 is in use). The dev server supports hot reloading.

Build (production)

```bash
npm run build
```

This produces an optimized production bundle in `build/`.

Deploy to Surge (static hosting)

1. Install Surge if you don't have it:

```bash
npm install -g surge
```

2. Build and deploy:

```bash
npm run build
npx surge ./build --domain your-frontend-domain.surge.sh
```

Replace `your-frontend-domain.surge.sh` with the desired domain (e.g. `chao-com.surge.sh`).

Environment variables

- `REACT_APP_API_URL` — the base URL for the backend API (default: `http://localhost:3000`).

The project includes a `.env.example` with the `REACT_APP_API_URL` entry; copy it to `.env` in development.

Available scripts

- `npm start` — start the development server
- `npm run build` — create a production build
- `npm test` — run frontend tests
- `npm run lint` — run linter (if configured)

Important notes

- The frontend expects the backend API routes as documented in the repository root `README.md` (auth, users, articles, comments, following, etc.).
- When deploying to Surge, ensure the backend `FRONTEND_URL` / CORS settings allow the deployed Surge domain.
- No secrets should be stored in this repo. Keep API keys and secrets in the backend `.env` (see `backend/.env.example`).

Where to look in the source

- `src/` — React source code
  - `src/api/` — API client wrappers used across the app
  - `src/components/` — reusable components (Header, ArticleCard, CommentSection, etc.)
  - `src/pages/` — top-level pages (Feed, Profile, Settings, Discover)
  - `src/context/` — `AuthContext` handles authentication state

Test account for graders

See root `README.md` for the test account username/password and full grader instructions.
