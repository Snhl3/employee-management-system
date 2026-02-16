from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User, UserRole
from ..schemas.user import UserResponse, UserUpdate, UserCreate
from .auth_utils import get_admin_user, get_password_hash
from ..models.employee import Employee
import uuid

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    # Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    # Use default password if none provided or for consistency with requirements
    # The requirement says "Hash password if applicable", and user provided "Neosoft@123"
    default_password = "Neosoft@123"
    
    new_user = User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=get_password_hash(default_password),
        role=user_in.role,
        is_active=user_in.is_active
    )
    
    db.add(new_user)
    
    # Auto-create Employee profile if not exists
    existing_employee = db.query(Employee).filter(Employee.email == user_in.email).first()
    if not existing_employee:
        emp_id = f"EMP-{str(uuid.uuid4())[:8].upper()}"
        new_employee = Employee(
            emp_id=emp_id,
            name=user_in.name,
            email=user_in.email,
            status="ON_BENCH"
        )
        db.add(new_employee)
    
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/", response_model=List[UserResponse])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    # Admins should see all users, including inactive ones
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    update: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if update.email is not None:
        # Check if email is already taken by another user
        existing_user = db.query(User).filter(User.email == update.email, User.id != user_id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = update.email
    
    if update.name is not None:
        user.name = update.name
        
    if update.role is not None:
        user.role = update.role
        
    if update.is_active is not None:
        # Prevent an admin from deactivating themselves
        if not update.is_active and user.id == admin.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin cannot deactivate their own account."
            )
        user.is_active = update.is_active
    
    if update.password is not None:
        user.hashed_password = get_password_hash(update.password)

    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot delete their own account."
        )
    
    # Also delete corresponding employee profile to prevent orphans/duplicates
    employee = db.query(Employee).filter(Employee.email == user.email).first()
    if employee:
        db.delete(employee)
    
    db.delete(user)
    db.commit()
    return None

@router.patch("/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    update: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    print(f"DEBUG: Admin {admin.email} is updating status for user ID {user_id}")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if update.is_active is not None:
        # Prevent an admin from deactivating themselves
        if not update.is_active and user.id == admin.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin cannot deactivate their own account."
            )
        user.is_active = update.is_active

    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int, 
    update: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    print(f"DEBUG: Admin {admin.email} is updating role for user ID {user_id}")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if update.role is not None:
        user.role = update.role
    
    db.commit()
    db.refresh(user)
    return user
