# SkillBridge — Free Deployment Guide

## Architecture (Free Tier)

| Part | Service | Cost |
|---|---|---|
| **Backend (FastAPI)** | [Render.com](https://render.com) | Free |
| **Frontend (React)** | [Vercel](https://vercel.com) | Free |
| **Database (PostgreSQL)** | [Neon.tech](https://neon.tech) | Free |

> **Why not SQLite?**  
> Render's free tier uses an **ephemeral filesystem** — the SQLite file is wiped on every redeploy. Use Neon (free Postgres) to persist your data permanently.

---

## ⚠️ Before You Start — Change These Secrets

### 1. Generate a strong SECRET_KEY

Open a terminal and run:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```
Copy the output — you'll paste it into Render's environment variables.

### 2. Files that must NOT go to GitHub
The `.gitignore` already protects:
- `backend/.env`
- `frontend/.env`
- `backend/skillbridge.db`
- `node_modules/`

---

## Step-by-Step Deployment

### STEP 1 — Push to GitHub

1. Create a new GitHub repository (e.g. `skillbridge`)
2. Push your code:
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/skillbridge.git
git push -u origin main
```

---

### STEP 2 — Set Up Free PostgreSQL on Neon

1. Go to [neon.tech](https://neon.tech) → **Sign up free**
2. Create a new project → name it `skillbridge`
3. Copy the **Connection string** — looks like:
   ```
   postgresql://user:password@ep-xxxxx.neon.tech/neondb?sslmode=require
   ```
4. Save this — you'll use it as `DATABASE_URL` in Render.

---

### STEP 3 — Deploy Backend on Render

1. Go to [render.com](https://render.com) → Sign up → **New → Web Service**
2. Connect your GitHub repo
3. Fill in:

| Field | Value |
|---|---|
| **Name** | `skillbridge-api` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` |

4. Under **Environment Variables**, add:

| Key | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string from Step 2 |
| `SECRET_KEY` | The random hex you generated above |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` |
| `FRONTEND_URL` | *(leave blank for now — fill after Step 4)* |

5. Click **Deploy** — wait ~3 minutes
6. Your backend URL will be: `https://skillbridge-api.onrender.com`
7. Test it by visiting: `https://skillbridge-api.onrender.com/docs`

---

### STEP 4 — Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up → **New Project**
2. Import your GitHub repo
3. Fill in:

| Field | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Framework** | `Vite` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

4. Under **Environment Variables**, add:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://skillbridge-api.onrender.com` |

5. Click **Deploy** — takes ~1 minute
6. Your site URL will be: `https://skillbridge-YOURNAME.vercel.app`

---

### STEP 5 — Connect Frontend URL back to Backend (CORS)

1. Go back to **Render → skillbridge-api → Environment**
2. Set `FRONTEND_URL` = `https://skillbridge-YOURNAME.vercel.app`
3. Click **Save Changes** → Render will redeploy automatically

---

## ✅ Everything is now live!

| | URL |
|---|---|
| **Frontend** | `https://skillbridge-YOURNAME.vercel.app` |
| **Backend API** | `https://skillbridge-api.onrender.com` |
| **API Docs** | `https://skillbridge-api.onrender.com/docs` |

---

## Important Notes

### Free Tier Limitations
- **Render free backend** spins down after 15 minutes of inactivity — the first request after sleep takes ~30 seconds to respond. This is normal; paid plan removes this.
- **Neon free** gives 0.5 GB storage — more than enough for a project.
- **Vercel free** has 100GB bandwidth/month — plenty.

### Updating the App Later
- **Frontend**: Push to GitHub → Vercel auto-redeploys
- **Backend**: Push to GitHub → Render auto-redeploys (if Auto-Deploy is ON)

### Local Development (unchanged)
```bash
# Backend
cd backend
uvicorn main:app --reload   # http://localhost:8000

# Frontend
cd frontend
npm run dev                 # http://localhost:5173
```
The frontend `.env` already has `VITE_API_URL=http://localhost:8000` for local dev.

---

## Files Changed for Deployment

| File | What Changed |
|---|---|
| `backend/main.py` | CORS reads `FRONTEND_URL` from env |
| `backend/.env` | Added `FRONTEND_URL`, improved comments |
| `backend/.env.example` | Template to share safely (no secrets) |
| `frontend/src/api/index.js` | API URL reads `VITE_API_URL` env var |
| `frontend/.env` | Added for local dev |
| `frontend/.env.example` | Template showing `VITE_API_URL` |
| `.gitignore` | Protects `.env` files and `node_modules` from Git |
