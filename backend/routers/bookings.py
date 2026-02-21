from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
import models, schemas
from auth import get_current_user, require_provider, require_user

router = APIRouter(prefix="/bookings", tags=["Bookings"])

VALID_TRANSITIONS = {
    "pending": ["accepted", "rejected"],
    "accepted": ["ongoing", "rejected"],
    "ongoing": ["completed"],
    "completed": ["disputed"],
}


def _create_notification(db, user_id: int, title: str, message: str):
    notif = models.Notification(user_id=user_id, title=title, message=message)
    db.add(notif)


@router.post("/", response_model=schemas.BookingOut)
def create_booking(
    data: schemas.BookingCreate,
    current_user: models.User = Depends(require_user),
    db: Session = Depends(get_db),
):
    # Edge case: past date
    from datetime import date
    try:
        booking_date = date.fromisoformat(data.booking_date)
        if booking_date < date.today():
            raise HTTPException(status_code=400, detail="Cannot book in the past")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Edge case: double booking check
    conflict = db.query(models.Booking).filter(
        models.Booking.provider_id == data.provider_id,
        models.Booking.booking_date == data.booking_date,
        models.Booking.booking_time == data.booking_time,
        models.Booking.status.in_(["pending", "accepted", "ongoing"]),
    ).first()
    if conflict:
        raise HTTPException(status_code=409, detail="Provider already has a booking at that time")

    booking = models.Booking(
        user_id=current_user.id,
        provider_id=data.provider_id,
        service_id=data.service_id,
        problem_description=data.problem_description,
        booking_date=data.booking_date,
        booking_time=data.booking_time,
        status="pending",
    )
    db.add(booking)
    db.flush()

    _create_notification(
        db, data.provider_id,
        "New Booking Request",
        f"{current_user.name} sent you a new booking request for {data.booking_date} at {data.booking_time}."
    )
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/user", response_model=List[schemas.BookingOut])
def my_bookings_as_user(
    current_user: models.User = Depends(require_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Booking)
        .options(
            joinedload(models.Booking.service),
            joinedload(models.Booking.provider),
            joinedload(models.Booking.review),
        )
        .filter(models.Booking.user_id == current_user.id)
        .order_by(models.Booking.created_at.desc())
        .all()
    )


@router.get("/provider", response_model=List[schemas.BookingOut])
def my_bookings_as_provider(
    current_user: models.User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Booking)
        .options(
            joinedload(models.Booking.service),
            joinedload(models.Booking.user),
            joinedload(models.Booking.review),
        )
        .filter(models.Booking.provider_id == current_user.id)
        .order_by(models.Booking.created_at.desc())
        .all()
    )


@router.put("/{booking_id}/status", response_model=schemas.BookingOut)
def update_booking_status(
    booking_id: int,
    update: schemas.BookingStatusUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    new_status = update.status

    # Role-based guards
    if new_status in ["accepted", "rejected", "ongoing"] and current_user.id != booking.provider_id:
        raise HTTPException(status_code=403, detail="Only the provider can perform this action")

    if new_status == "completed":
        if current_user.id != booking.provider_id:
            raise HTTPException(status_code=403, detail="Only provider can mark as complete")

    if new_status == "disputed":
        if current_user.id != booking.user_id:
            raise HTTPException(status_code=403, detail="Only user can dispute")

    # Status transition validation
    allowed = VALID_TRANSITIONS.get(booking.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{booking.status}' to '{new_status}'"
        )

    booking.status = new_status

    # Notifications
    status_messages = {
        "accepted": ("Booking Accepted", f"Your booking on {booking.booking_date} was accepted!", booking.user_id),
        "rejected": ("Booking Rejected", f"Your booking on {booking.booking_date} was rejected.", booking.user_id),
        "ongoing": ("Work Started", f"Provider has started working on your booking ({booking.booking_date}).", booking.user_id),
        "completed": ("Work Completed", f"Provider marked booking ({booking.booking_date}) as completed. Please confirm.", booking.user_id),
        "disputed": ("Dispute Raised", f"User raised a dispute on booking #{booking_id}.", booking.provider_id),
    }
    if new_status in status_messages:
        title, msg, notify_uid = status_messages[new_status]
        _create_notification(db, notify_uid, title, msg)

    # Add to calendar on accept
    if new_status == "accepted":
        service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
        cal_event = models.CalendarEvent(
            provider_id=booking.provider_id,
            title=f"Booking: {service.service_name if service else 'Service'}",
            event_type="booking",
            start_datetime=f"{booking.booking_date}T{booking.booking_time}",
            color="#6366f1",
        )
        db.add(cal_event)

    db.commit()
    db.refresh(booking)
    return booking
