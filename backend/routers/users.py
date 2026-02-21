from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=schemas.UserOut)
def get_my_profile(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=schemas.UserOut)
def update_my_profile(
    update_data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    for field, value in update_data.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/providers/list", response_model=List[schemas.UserOut])
def list_providers(
    location: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.User).filter(models.User.role == "provider")
    if location:
        query = query.filter(models.User.location.ilike(f"%{location}%"))
    return query.all()
