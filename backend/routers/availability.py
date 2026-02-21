from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth import require_provider

router = APIRouter(prefix="/availability", tags=["Provider Availability"])


@router.get("/", response_model=List[schemas.AvailabilityOut])
def get_my_availability(
    current_user: models.User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    return db.query(models.ProviderAvailability).filter(
        models.ProviderAvailability.provider_id == current_user.id
    ).all()


@router.get("/{provider_id}", response_model=List[schemas.AvailabilityOut])
def get_provider_availability(provider_id: int, db: Session = Depends(get_db)):
    return db.query(models.ProviderAvailability).filter(
        models.ProviderAvailability.provider_id == provider_id
    ).all()


@router.post("/", response_model=schemas.AvailabilityOut)
def set_availability(
    data: schemas.AvailabilityCreate,
    current_user: models.User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    existing = db.query(models.ProviderAvailability).filter(
        models.ProviderAvailability.provider_id == current_user.id,
        models.ProviderAvailability.day_of_week == data.day_of_week,
    ).first()
    if existing:
        existing.start_time = data.start_time
        existing.end_time = data.end_time
        db.commit()
        db.refresh(existing)
        return existing

    avail = models.ProviderAvailability(provider_id=current_user.id, **data.model_dump())
    db.add(avail)
    db.commit()
    db.refresh(avail)
    return avail


@router.delete("/{avail_id}")
def delete_availability(
    avail_id: int,
    current_user: models.User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    avail = db.query(models.ProviderAvailability).filter(
        models.ProviderAvailability.id == avail_id,
        models.ProviderAvailability.provider_id == current_user.id,
    ).first()
    if not avail:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(avail)
    db.commit()
    return {"message": "Deleted"}
