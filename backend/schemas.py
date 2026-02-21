from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "user"          # "user" or "provider"
    age: Optional[int] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    mobile: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    name: str


# ── User / Provider ───────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    age: Optional[int]
    location: Optional[str]
    bio: Optional[str]
    mobile: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    mobile: Optional[str] = None
    avatar_url: Optional[str] = None


# ── Services ──────────────────────────────────────────────────────────────────

class ServiceCreate(BaseModel):
    service_name: str
    description: Optional[str] = None
    min_price: float
    category: str
    image_url: Optional[str] = None


class ServiceUpdate(BaseModel):
    service_name: Optional[str] = None
    description: Optional[str] = None
    min_price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None


class ServiceOut(BaseModel):
    id: int
    provider_id: int
    service_name: str
    description: Optional[str]
    min_price: float
    category: str
    image_url: Optional[str]
    created_at: datetime
    provider: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ── Bookings ──────────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    service_id: int
    provider_id: int
    problem_description: Optional[str] = None
    booking_date: str
    booking_time: str


class BookingStatusUpdate(BaseModel):
    status: str   # accepted | rejected | ongoing | completed | disputed


class BookingOut(BaseModel):
    id: int
    user_id: int
    provider_id: int
    service_id: int
    problem_description: Optional[str]
    booking_date: str
    booking_time: str
    status: str
    created_at: datetime
    user: Optional[UserOut] = None
    provider: Optional[UserOut] = None
    service: Optional[ServiceOut] = None
    review: Optional['ReviewOut'] = None

    class Config:
        from_attributes = True


# ── Reviews ───────────────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    booking_id: int
    rating: float = Field(..., ge=1, le=5)
    feedback: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    booking_id: int
    user_id: int
    provider_id: int
    rating: float
    feedback: Optional[str]
    created_at: datetime
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ── Calendar ──────────────────────────────────────────────────────────────────

class CalendarEventCreate(BaseModel):
    title: str
    event_type: str = "event"   # holiday | event | reminder | booking
    start_datetime: str
    end_datetime: Optional[str] = None
    color: Optional[str] = None


class CalendarEventOut(BaseModel):
    id: int
    provider_id: int
    title: str
    event_type: str
    start_datetime: str
    end_datetime: Optional[str]
    color: Optional[str]

    class Config:
        from_attributes = True


# ── Notifications ─────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Provider Availability ─────────────────────────────────────────────────────

class AvailabilityCreate(BaseModel):
    day_of_week: int   # 0=Mon, 6=Sun
    start_time: str
    end_time: str


class AvailabilityOut(BaseModel):
    id: int
    provider_id: int
    day_of_week: int
    start_time: str
    end_time: str

    class Config:
        from_attributes = True
