# SkillBridge – Project Run Guide

## 📋 Prerequisites

Make sure the following are installed on your system:

| Tool | Version | Install Link |
|---|---|---|
| Python | 3.10+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| pip | latest | (comes with Python) |
| npm | latest | (comes with Node) |

---

## 🗂️ Project Structure

```
SkillBridge/
├── backend/          ← FastAPI Python backend
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── database.py
│   ├── routers/
│   ├── .env
│   └── requirements.txt
├── frontend/         ← React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   └── context/
│   ├── index.html
│   └── package.json
├── guide.md          ← This file
└── inst.md           ← Project specification
```

---

## 🚀 Running the Project

### Terminal 1 — Start the Backend

```powershell
# Navigate to the backend folder
cd "e:\4th yr\Practice\SkillBridge\backend"

# (First time only) Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

**The backend will be available at:** `http://localhost:8000`  
**Interactive API docs (Swagger UI):** `http://localhost:8000/docs`

> 💡 The SQLite database file (`skillbridge.db`) is created automatically on first run.  
> No database setup needed!

---

### Terminal 2 — Start the Frontend

```powershell
# Navigate to the frontend folder
cd "e:\4th yr\Practice\SkillBridge\frontend"

# (First time only) Install Node dependencies
npm install

# Start the Vite dev server
npm run dev
```

**The frontend will be available at:** `http://localhost:5173`

---

## 🌐 Using the Application

1. Open `http://localhost:5173` in your browser
2. Click **Get Started** to register

### Register as a User
- Click **Register** → Choose "I need services"
- Fill in your details and register
- You'll be redirected to the **User Dashboard**

### Register as a Provider
- Click **Register** → Choose "I provide services"
- Fill in your details (include a bio!) and register
- You'll be redirected to the **Provider Dashboard**

---

## 🔄 Full Workflow Demo

### Step 1 — Provider sets up
1. Register/Login as provider
2. Go to **Dashboard → Services** → Add a service (e.g., "Pipe Repair", Plumbing, ₹500)

### Step 2 — User books a service
1. Register/Login as a user
2. Go to **Browse Services** → Find the service
3. Click the service card → View provider profile
4. Click "Book Now" → Choose date, time, describe problem → Submit

### Step 3 — Provider handles the booking
1. Login as provider → **Dashboard → Requests**
2. See the **Pending** booking → Click **Accept**
3. When you arrive → Click **Start Work** (status → Ongoing)
4. After finishing → Click **Mark Complete**

### Step 4 — User confirms and rates
1. Login as user → **Dashboard → My Bookings**
2. Booking shows as "Completed"
3. Click **Rate Service** → Give stars + feedback

### Step 5 — Calendar (Provider)
1. Login as provider → **Dashboard → Calendar**
2. See accepted bookings on the calendar automatically
3. Click **Add Event** to add holidays, reminders, custom events

---

## 🔌 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/auth/register` | POST | Register user or provider |
| `/auth/login` | POST | Login and get JWT token |
| `/users/me` | GET | Get your profile |
| `/services/` | GET | List all services (supports `?search=`, `?category=`, `?location=`) |
| `/services/my` | GET | Provider's own services |
| `/bookings/` | POST | Create a booking (user) |
| `/bookings/user` | GET | My bookings as user |
| `/bookings/provider` | GET | My bookings as provider |
| `/bookings/{id}/status` | PUT | Update booking status |
| `/reviews/` | POST | Submit a review |
| `/calendar/` | GET/POST | Provider calendar events |
| `/notifications/` | GET | Get notifications |

Full interactive docs: **http://localhost:8000/docs**

---

## 🐛 Troubleshooting

| Problem | Solution |
|---|---|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` again |
| Port 8000 already in use | Change port: `uvicorn main:app --reload --port 8001` and update `src/api/index.js` BASE_URL |
| Port 5173 already in use | Vite will auto-pick next available port |
| CORS errors | Make sure backend is running on port 8000 |
| Login loop | Clear browser localStorage and try again |
| Empty search results | Make sure a provider has added services first |

---

## 🔧 Environment Variables (backend/.env)

```env
DATABASE_URL=sqlite:///./skillbridge.db
SECRET_KEY=skillbridge_super_secret_key_change_in_production_2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

> ⚠️ For production, change `SECRET_KEY` to a random 64-char string and switch `DATABASE_URL` to a PostgreSQL connection string.

---

## 📦 For Production Build

```powershell
# Build frontend
cd "e:\4th yr\Practice\SkillBridge\frontend"
npm run build    # creates dist/ folder

# Run backend in production
cd "e:\4th yr\Practice\SkillBridge\backend"
uvicorn main:app --host 0.0.0.0 --port 8000
```

- Deploy `frontend/dist/` to **Vercel** or **Netlify**
- Deploy `backend/` to **Render** or **Railway** (with a PostgreSQL addon)
