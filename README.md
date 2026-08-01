# Major Project

Full-stack internship, services, and AI workflow platform built with React, Vite, TypeScript, Tailwind CSS, Supabase, and a Python FastAPI backend.

## Overview

This project combines:

- Internship discovery and application workflows
- AI roadmap generation and saved roadmap history
- Resume parsing and screening utilities
- Product, service, and checkout flows
- Admin dashboards for users, internships, orders, bookings, analytics, and screening
- Supabase-backed authentication, data storage, and realtime updates

The application is split into two main parts:

- Frontend: React + Vite + TypeScript
- Backend AI service: FastAPI + Python

## Features

- User registration, login, email verification, and password reset
- Internship browsing, application submission, and application tracking
- AI roadmap generation and saved roadmap viewing
- AI chatbot assistance
- Product and service browsing
- Cart, checkout, and order history
- Service booking workflows
- Admin panels for operational management
- Resume screening and scoring tools exposed by the Python service

## Tech Stack

- React 18
- Vite 5
- TypeScript
- Tailwind CSS
- shadcn/ui and Radix UI
- React Router
- TanStack React Query
- Supabase
- FastAPI
- Uvicorn
- SQLAlchemy
- Pandas / scikit-learn / Python ML utilities

## Repository Structure

- `src/` - Frontend app source code
- `public/` - Static assets and public files
- `recommendation_service/` - Python backend for recommendations, roadmap generation, and resume screening
- `supabase/` - Supabase config, migrations, and Edge Functions
- `start_app.bat` - Windows launcher for backend + frontend
- `USER_MANUAL_ISO_IEC_26515.md` - Detailed user manual and setup reference

## Prerequisites

Install the following before running the project:

- Node.js 18 or later
- npm
- Python 3.10 or later, recommended 3.11
- Git
- A Supabase project
- Optional: Gemini / Google API key, Google Maps API key, and Razorpay key if you use those features

## Environment Variables

Create a `.env` file at the project root for the frontend and a `.env` file inside `recommendation_service/` for the backend.

### Frontend `.env`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### Backend `recommendation_service/.env`

```env
GOOGLE_API_KEY=your_google_api_key
GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_or_anon_key
PORT=5001
DB_URL=sqlite:///./screening.db
JWT_SECRET=your_jwt_secret_if_needed
```

Notes:

- The frontend requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- The backend also reads Supabase values when it fetches recommendation history.
- Some features will gracefully fall back when optional AI or payment keys are missing.

## Installation

From the repo root:

```bash
npm install
```

For the Python backend:

```bash
cd recommendation_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Running the Project

### Option 1: Windows launcher

From the repo root, run:

```bat
start_app.bat
```

This script:

- starts the Python backend from `recommendation_service/`
- uses `.venv311\Scripts\python.exe` if it exists, otherwise falls back to `python`
- starts the frontend with `npm run dev`

### Option 2: Run manually

Open two terminals.

Backend:

```bash
cd recommendation_service
python app.py
```

Backend default endpoint:

```text
http://127.0.0.1:5001/health
```

Frontend:

```bash
npm run dev
```

Then open the local URL shown by Vite, usually:

```text
http://localhost:5173
```

## Build

Frontend production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Backend API

The Python service provides endpoints for:

- internship recommendations
- roadmap generation
- resume parsing
- resume upload and screening
- screening result management

Important routes include:

- `GET /health`
- `POST /recommend`
- `POST /generate-roadmap`
- `POST /parse-resume`
- `POST /api/criteria`
- `POST /api/upload-resumes`

## Usage Notes

- Keep the repo root as the main working directory.
- Do not move the `.git` folder if you rename or relocate the project.
- The repository includes generated assets such as `dist/` and Python temp folders; check `git status` before committing.
- On Windows, line-ending warnings may appear when Git stages files. They do not usually affect the app.

## Deploying / Uploading to GitHub

After verifying the app runs:

```bash
git status
git add .
git commit -m "Flatten project root and update documentation"
git push origin main
```

If your branch is not `main`, replace it with your current branch name.

If you want to keep unrelated edits separate, stage only the files you intend to commit.

## Troubleshooting

- If the frontend fails to start, confirm the root `.env` file exists and includes the Supabase keys.
- If the Python service fails to start, confirm dependencies are installed in the active virtual environment.
- If resume screening or roadmap generation fails, check the backend logs and any missing AI keys.
- If map, chatbot, or checkout features are unavailable, verify the optional API keys.

## License and Documentation

- See `COPYRIGHT_DOCUMENT.md` for copyright information.
- See `USER_MANUAL_ISO_IEC_26515.md` for the full user manual and more detailed setup steps.