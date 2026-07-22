from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.user import User, Role
from app.schemas.user import UserOut, UserUpdate, RoleOut
from app.auth.dependencies import RoleChecker, get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])

# Enforce Administrator access for all user management endpoints
admin_check = RoleChecker(["Administrator"])

@router.get("", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(admin_check)):
    return db.query(User).all()

@router.get("/roles", response_model=List[RoleOut])
def list_roles(db: Session = Depends(get_db), current_user: User = Depends(admin_check)):
    return db.query(Role).all()

@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(admin_check)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int, 
    user_in: UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(admin_check)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_in.email:
        user.email = user_in.email
    if user_in.status is not None:
        user.status = user_in.status
    if user_in.roles is not None:
        # Clear existing roles
        user.roles = []
        # Assign new roles
        for role_name in user_in.roles:
            role = db.query(Role).filter(Role.name == role_name).first()
            if role:
                user.roles.append(role)
            else:
                new_role = Role(name=role_name, description=f"{role_name} Role")
                db.add(new_role)
                db.commit()
                db.refresh(new_role)
                user.roles.append(new_role)
                
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(admin_check)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Administrators cannot delete themselves")
        
    db.delete(user)
    db.commit()
    return None
