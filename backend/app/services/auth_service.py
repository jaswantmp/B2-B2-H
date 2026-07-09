# app/services/auth_service.py
from datetime import timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.schemas.auth import LoginRequest
from app.utils.security import get_password_hash, verify_password, create_access_token
from app.config import settings


class AuthService:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate) -> User:
        """Hash credentials and record a new builder profile in the database."""
        hashed_password = get_password_hash(user_in.password)
        db_user = User(
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
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def authenticate_user(db: Session, login_data: LoginRequest) -> User | None:
        """Authenticate user email and password credentials."""
        user = db.query(User).filter(User.email == login_data.email).first()
        if not user or not verify_password(login_data.password, user.hashed_password):
            return None
        return user

    @staticmethod
    def create_jwt_token(user: User) -> str:
        """Generate JWT access token for authentication session."""
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        return create_access_token(
            data={"sub": user.id}, expires_delta=access_token_expires
        )
