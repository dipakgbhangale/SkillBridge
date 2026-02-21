from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth import require_provider

router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get("/", response_model=List[schemas.CalendarEventOut])
def get_my_events(
    current_user: models.User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    return db.query(models.CalendarEvent).filter(
        models.CalendarEvent.provider_id == current_user.id
    ).all()


@router.post("/", response_model=schemas.CalendarEventOut)
def create_event(
    data: schemas.CalendarEventCreate,
    current_user: models.User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    event = models.CalendarEvent(provider_id=current_user.id, **data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.put("/{event_id}", response_model=schemas.CalendarEventOut)
def update_event(
    event_id: int,
    data: schemas.CalendarEventCreate,
    current_user: models.User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    event = db.query(models.CalendarEvent).filter(
        models.CalendarEvent.id == event_id,
        models.CalendarEvent.provider_id == current_user.id,
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for f, v in data.model_dump(exclude_none=True).items():
        setattr(event, f, v)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    current_user: models.User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    event = db.query(models.CalendarEvent).filter(
        models.CalendarEvent.id == event_id,
        models.CalendarEvent.provider_id == current_user.id,
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"message": "Event deleted"}
