from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
from database import get_db
import models, schemas
from auth import get_current_user, require_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/", response_model=schemas.ReviewOut)
def submit_review(
    data: schemas.ReviewCreate,
    current_user: models.User = Depends(require_user),
    db: Session = Depends(get_db),
):
    booking = db.query(models.Booking).filter(
        models.Booking.id == data.booking_id,
        models.Booking.user_id == current_user.id,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed bookings")

    existing = db.query(models.Review).filter(models.Review.booking_id == data.booking_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this booking")

    review = models.Review(
        booking_id=data.booking_id,
        user_id=current_user.id,
        provider_id=booking.provider_id,
        rating=data.rating,
        feedback=data.feedback,
    )
    db.add(review)
    db.add(models.Notification(
        user_id=booking.provider_id,
        title="New Review Received",
        message=f"{current_user.name} gave you {data.rating}⭐ rating.",
    ))
    db.commit()
    db.refresh(review)
    return review


@router.put("/{booking_id}", response_model=schemas.ReviewOut)
def edit_review(
    booking_id: int,
    data: schemas.ReviewCreate,
    current_user: models.User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Edit a review within 24 hours of original submission."""
    review = db.query(models.Review).filter(
        models.Review.booking_id == booking_id,
        models.Review.user_id == current_user.id,
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if datetime.utcnow() - review.created_at > timedelta(hours=24):
        raise HTTPException(status_code=400, detail="Review edit window has expired (24 hours)")

    review.rating = data.rating
    review.feedback = data.feedback
    db.commit()
    db.refresh(review)
    return review


@router.get("/booking/{booking_id}", response_model=schemas.ReviewOut)
def get_review_for_booking(
    booking_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(models.Review).options(joinedload(models.Review.user)).filter(
        models.Review.booking_id == booking_id
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="No review for this booking")
    return review


@router.get("/provider/{provider_id}", response_model=List[schemas.ReviewOut])
def provider_reviews(provider_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.Review)
        .options(joinedload(models.Review.user))
        .filter(models.Review.provider_id == provider_id)
        .order_by(models.Review.created_at.desc())
        .all()
    )


@router.get("/provider/{provider_id}/avg")
def provider_avg_rating(provider_id: int, db: Session = Depends(get_db)):
    result = db.query(func.avg(models.Review.rating), func.count(models.Review.id)).filter(
        models.Review.provider_id == provider_id
    ).first()
    return {
        "provider_id": provider_id,
        "avg_rating": round(result[0] or 0, 1),
        "total_reviews": result[1],
    }
