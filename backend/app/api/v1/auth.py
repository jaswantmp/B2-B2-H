# app/api/v1/auth.py
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserCreate, UserResponse
from app.utils.security import verify_password, get_password_hash, create_access_token
from app.dependencies import get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user profile with encrypted credentials."""
    # Check duplicate email
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    # Check duplicate username
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists.",
        )

    # Hash the password and create user model
    hashed_password = get_password_hash(user_in.password)
    user = User(
        name=user_in.name,
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        bio=user_in.bio,
        avatar=user_in.avatar,
        location=user_in.location,
        university=user_in.university,
        college=user_in.college,
        district=user_in.district,
        city=user_in.city,
        state=user_in.state,
        year=user_in.year,
        branch=user_in.branch,
        github=user_in.github,
        linkedin=user_in.linkedin,
        twitter=user_in.twitter,
        website=user_in.website,
        status=user_in.status,
        hackathons_won=user_in.hackathons_won,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(login_credentials: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate email and password credentials and issue a JWT token."""
    user = db.query(User).filter(User.email == login_credentials.email).first()
    if not user or not verify_password(login_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated",
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Protected route returning the authenticated user details."""
    return current_user


@router.get("/protected-route-example")
def protected_route_example(current_user: User = Depends(get_current_user)):
    """An example of a route protected by authentication."""
    return {
        "message": f"Hello {current_user.name}! You are successfully authenticated.",
        "user_id": current_user.id,
    }
