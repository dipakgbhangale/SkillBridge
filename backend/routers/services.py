from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from database import get_db
import models, schemas
from auth import get_current_user, require_provider

router = APIRouter(prefix="/services", tags=["Services"])


@router.get("/", response_model=List[schemas.ServiceOut])
def list_services(
    category: Optional[str] = None,
    search: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Service).options(joinedload(models.Service.provider))

    if category:
        query = query.filter(models.Service.category.ilike(f"%{category}%"))
    if search:
        query = query.filter(
            models.Service.service_name.ilike(f"%{search}%") |
            models.Service.description.ilike(f"%{search}%")
        )
    if location:
        query = query.join(models.User, models.Service.provider_id == models.User.id)
        query = query.filter(models.User.location.ilike(f"%{location}%"))

    return query.all()


@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    results = db.query(models.Service.category).distinct().all()
    return [r[0] for r in results]


@router.get("/my", response_model=List[schemas.ServiceOut])
def my_services(
    current_user: models.User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    return db.query(models.Service).filter(models.Service.provider_id == current_user.id).all()


@router.get("/{service_id}", response_model=schemas.ServiceOut)
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(models.Service).options(
        joinedload(models.Service.provider)
    ).filter(models.Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.get("/provider/{provider_id}", response_model=List[schemas.ServiceOut])
def provider_services(provider_id: int, db: Session = Depends(get_db)):
    return db.query(models.Service).filter(models.Service.provider_id == provider_id).all()


@router.post("/", response_model=schemas.ServiceOut)
def create_service(
    service_data: schemas.ServiceCreate,
    current_user: models.User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    service = models.Service(provider_id=current_user.id, **service_data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/{service_id}", response_model=schemas.ServiceOut)
def update_service(
    service_id: int,
    update_data: schemas.ServiceUpdate,
    current_user: models.User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    service = db.query(models.Service).filter(
        models.Service.id == service_id,
        models.Service.provider_id == current_user.id
    ).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found or not yours")
    for f, v in update_data.model_dump(exclude_none=True).items():
        setattr(service, f, v)
    db.commit()
    db.refresh(service)
    return service


@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    current_user: models.User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    service = db.query(models.Service).filter(
        models.Service.id == service_id,
        models.Service.provider_id == current_user.id
    ).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(service)
    db.commit()
    return {"message": "Service deleted"}
