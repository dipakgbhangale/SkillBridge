from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, Boolean, Time
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()


class RoleEnum(str, enum.Enum):
    user = "user"
    provider = "provider"


class BookingStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    ongoing = "ongoing"
    completed = "completed"
    disputed = "disputed"


class EventType(str, enum.Enum):
    holiday = "holiday"
    event = "event"
    reminder = "reminder"
    booking = "booking"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    mobile = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user")
    age = Column(Integer, nullable=True)
    location = Column(String(200), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    services = relationship("Service", back_populates="provider", foreign_keys="Service.provider_id")
    bookings_as_user = relationship("Booking", back_populates="user", foreign_keys="Booking.user_id")
    bookings_as_provider = relationship("Booking", back_populates="provider", foreign_keys="Booking.provider_id")
    reviews_given = relationship("Review", back_populates="user", foreign_keys="Review.user_id")
    reviews_received = relationship("Review", back_populates="provider", foreign_keys="Review.provider_id")
    availability = relationship("ProviderAvailability", back_populates="provider")
    calendar_events = relationship("CalendarEvent", back_populates="provider")
    notifications = relationship("Notification", back_populates="user")


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    min_price = Column(Float, nullable=False, default=0.0)
    category = Column(String(100), nullable=False)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    provider = relationship("User", back_populates="services", foreign_keys=[provider_id])
    bookings = relationship("Booking", back_populates="service")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    problem_description = Column(Text, nullable=True)
    booking_date = Column(String(20), nullable=False)
    booking_time = Column(String(10), nullable=False)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bookings_as_user", foreign_keys=[user_id])
    provider = relationship("User", back_populates="bookings_as_provider", foreign_keys=[provider_id])
    service = relationship("Service", back_populates="bookings")
    review = relationship("Review", back_populates="booking", uselist=False)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Float, nullable=False)
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", back_populates="review")
    user = relationship("User", back_populates="reviews_given", foreign_keys=[user_id])
    provider = relationship("User", back_populates="reviews_received", foreign_keys=[provider_id])


class ProviderAvailability(Base):
    __tablename__ = "provider_availability"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Mon, 6=Sun
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)

    provider = relationship("User", back_populates="availability")


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(300), nullable=False)
    event_type = Column(String(20), default="event")
    start_datetime = Column(String(50), nullable=False)
    end_datetime = Column(String(50), nullable=True)
    color = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    provider = relationship("User", back_populates="calendar_events")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(300), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
