# SkillBridge — Project Documentation

## Overview

**SkillBridge** is a full-stack service marketplace web application that connects **users** (customers) with **providers** (skilled workers such as plumbers, electricians, painters, etc.). Users can browse services, book appointments, and leave reviews. Providers manage their services, bookings, calendar, and public profile — all from a single dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (Vite), Tailwind CSS, React Router v6 |
| **Backend** | Python · FastAPI |
| **Database** | SQLite (via SQLAlchemy ORM) |
| **Auth** | JWT (JSON Web Tokens) with `python-jose` |
| **HTTP Client** | Axios (centralized API layer) |
| **Calendar** | FullCalendar (dayGrid + timeGrid + interaction plugins) |
| **Notifications** | `react-hot-toast` |
| **Icons** | Lucide React |

---

## Project Structure

```
SkillBridge/
├── backend/                  # FastAPI backend
│   ├── main.py               # App entry, CORS, router includes, /stats & /health
│   ├── models.py             # SQLAlchemy ORM models
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── database.py           # SQLite engine, session factory
│   ├── auth.py               # JWT creation, password hashing, current_user deps
│   ├── requirements.txt      # Python dependencies
│   ├── skillbridge.db        # SQLite database file
│   └── routers/
│       ├── auth.py           # /register, /login
│       ├── users.py          # /users/me, /users/{id}, profile update
│       ├── services.py       # CRUD for services + list/search
│       ├── bookings.py       # Create, list (by user/provider), status update
│       ├── reviews.py        # Create, edit (24hr window), avg rating
│       ├── calendar.py       # Provider calendar events CRUD
│       ├── notifications.py  # List, mark-read, unread count
│       └── availability.py   # Provider availability slots
│
└── frontend/                 # React + Vite frontend
    └── src/
        ├── main.jsx          # React root mount
        ├── App.jsx           # Routes (lazy-loaded), AuthProvider, Toaster
        ├── index.css         # Global styles, animations, FullCalendar overrides
        ├── api/
        │   └── index.js      # Centralized Axios API layer (all endpoints)
        ├── context/
        │   └── AuthContext.jsx  # Auth state (user, token, login/logout)
        ├── components/
        │   ├── Navbar.jsx       # Top nav with notifications panel, avatar
        │   ├── ui.jsx           # Shared UI: ServiceCard, Modals, Badges, etc.
        │   └── LoadingSpinner.jsx  # PageLoader, Skeleton, CardSkeleton
        └── pages/
            ├── Landing.jsx         # Home page with live stats count-up
            ├── Login.jsx           # Login form
            ├── Register.jsx        # Register (user or provider)
            ├── Search.jsx          # Browse & filter services
            ├── ProviderProfile.jsx # Public provider page, booking modal
            ├── UserDashboard.jsx   # User: bookings, reviews, profile
            ├── ProviderDashboard.jsx  # Provider: requests, services, calendar, ratings, profile
            └── NotFound.jsx        # 404 page
```

---

## Database Models

### User
Stores both regular users and service providers (distinguished by `role`).

| Field | Type | Notes |
|---|---|---|
| `id` | int | Primary key |
| `name` | str | Full name |
| `email` | str | Unique |
| `password_hash` | str | Bcrypt hashed |
| `role` | str | `"user"` or `"provider"` |
| `age` | int | Optional |
| `location` | str | Optional |
| `bio` | str | Optional |
| `mobile` | str | Optional |
| `avatar_url` | str | Base64 image, max 500 KB |
| `created_at` | datetime | Auto |

### Service
Created by providers, listed on the marketplace.

| Field | Notes |
|---|---|
| `service_name` | e.g. "Pipe Leak Repair" |
| `category` | Plumbing, Electrical, Cleaning, etc. |
| `min_price` | Minimum price in ₹ |
| `description` | Optional |
| `provider_id` | FK → User |

### Booking
Represents a user booking a provider's service.

| Field | Notes |
|---|---|
| `booking_date` | Date string (YYYY-MM-DD) |
| `booking_time` | Time string (HH:MM, 24hr stored) |
| `problem_description` | User's description |
| `status` | `pending → accepted → ongoing → completed` (or `rejected` / `disputed`) |
| `user_id`, `provider_id`, `service_id` | FK references |

### Review
Left by users after a completed booking.

| Field | Notes |
|---|---|
| `rating` | 1–5 float |
| `feedback` | Optional text |
| `created_at` | Enforces 24-hour edit window |
| `booking_id` | One review per booking |

### CalendarEvent
Provider-owned calendar entries.

| Field | Notes |
|---|---|
| `title` | Event title |
| `event_type` | `event`, `holiday`, `reminder` |
| `start_datetime` | ISO datetime string |
| `end_datetime` | Optional |
| `color` | Hex color code |
| `reminder_minutes` | Minutes before to remind (stored, optional) |

### Notification
System notifications for users and providers (e.g. booking status changes).

| Field | Notes |
|---|---|
| `title`, `message` | Notification content |
| `is_read` | Boolean |
| `user_id` | FK → User |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new user/provider |
| POST | `/auth/login` | Login, returns JWT token |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/me` | Get logged-in user profile |
| GET | `/users/{id}` | Get any user by ID |
| PUT | `/users/me` | Update profile (name, bio, avatar, etc.) |

### Services
| Method | Endpoint | Description |
|---|---|---|
| GET | `/services/` | List all services (search, category, location filters) |
| GET | `/services/my` | Provider's own services |
| GET | `/services/{id}` | Single service |
| GET | `/services/provider/{id}` | All services by a provider |
| POST | `/services/` | Create service (provider only) |
| PUT | `/services/{id}` | Update service |
| DELETE | `/services/{id}` | Delete service |

### Bookings
| Method | Endpoint | Description |
|---|---|---|
| POST | `/bookings/` | Create a booking |
| GET | `/bookings/user` | User's bookings (with service, provider, review joined) |
| GET | `/bookings/provider` | Provider's bookings (with service, user, review joined) |
| PUT | `/bookings/{id}/status` | Update status (provider) |

### Reviews
| Method | Endpoint | Description |
|---|---|---|
| POST | `/reviews/` | Submit a review for a booking |
| PUT | `/reviews/{booking_id}` | Edit review (within 24 hours only) |
| GET | `/reviews/provider/{id}` | All reviews for a provider |
| GET | `/reviews/avg/{id}` | Avg rating + total count for a provider |

### Calendar
| Method | Endpoint | Description |
|---|---|---|
| GET | `/calendar/` | Provider's calendar events |
| POST | `/calendar/` | Create event (holiday/reminder/custom) |
| DELETE | `/calendar/{id}` | Delete event |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications/` | All notifications for logged-in user |
| GET | `/notifications/unread-count` | Count of unread notifications |
| PUT | `/notifications/read-all` | Mark all as read |

### Stats & Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | Returns `total_services`, `total_providers`, `avg_rating` (used on landing page) |
| GET | `/health` | Health check |

---

## Key Features

### For Users
- **Browse & Search** — filter services by name, category, and location
- **Provider Preview** — click a service card to see provider info in a popup; click the avatar to view a zoomed profile photo
- **Book a Service** — select date (custom calendar picker popup), time (12-hour AM/PM dropdowns), and describe the problem
- **Track Bookings** — dashboard shows all bookings with live status badges
- **Rate & Review** — submit a star rating and feedback after a completed job
- **Edit Review** — reviews are editable within 24 hours of submission; a countdown is shown
- **Profile with Avatar** — upload a profile photo; visible across the platform

### For Providers
- **Service Management** — add, edit, and delete listed services with an animated confirm-delete dialog
- **Booking Requests** — accept, reject, start, or complete bookings from a sectioned requests dashboard
- **Calendar** — full month/week view FullCalendar with:
  - Accepted and ongoing bookings shown automatically
  - Custom events (holiday, reminder, event) with color coding
  - Reminder option (10 min / 30 min / 1 hr / 2 hr / 1 day before)
  - Animated confirm-delete popup instead of browser `window.confirm`
  - Color legend displayed above the calendar (Accepted Booking / Ongoing Work / Holiday / Reminder / Event)
- **Ratings Tab** — view all reviews left by clients
- **Profile Edit** — update name, location, mobile, bio, and avatar

### Platform
- **Dynamic Landing Page** — stat counters (total services, providers, avg rating) fetched live from `/stats` API with animated count-up
- **JWT Authentication** — token stored in `localStorage`, attached to every request via Axios interceptor; auto-logout on token expiry
- **Role-based Routes** — `PrivateRoute` and `ProviderRoute` guard dashboards; users and providers see different dashboards
- **Performance** — all routes are `React.lazy` + `Suspense` for code-splitting; `CardSkeleton` shimmer placeholders during data loads
- **Notifications Panel** — slide-out panel in Navbar with unread count badge and mark-all-read

---

## Running the Project

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# Runs at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

> **Note:** The backend must be running before starting the frontend. CORS is already configured to allow `http://localhost:5173`.

---

## Design System

The UI is built with **Tailwind CSS** extended with a custom design system:

- **Color palette** — `primary` (indigo/violet), `dark` (layered dark backgrounds), semantic status colors
- **Animations** — `fadeIn`, `slideUp`, `scaleIn`, `shimmer`, `glowPulse`, `float` — all defined in `tailwind.config.js` and used as utility classes
- **Components** (`index.css`) — `.card`, `.card-hover`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input`, `.label`, `.badge`, `.badge-pending/accepted/ongoing/completed`, `.tab-btn-active`, `.section-title`, `.text-gradient`, `.shadow-glow`
- **Google Font** — Inter (300–900 weights)
- **FullCalendar** — fully re-styled to match the dark theme with custom day headers, event colors, and today highlight

---

## Author

Developed as a 4th Year IT practice project.  
Location of project: `e:\4th yr\Practice\SkillBridge`
