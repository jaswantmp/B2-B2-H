# app/api/v1/auth.py
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.password_reset_token import PasswordResetToken
from app.schemas.auth import LoginRequest, Token, PasswordResetRequest, PasswordResetConfirm
from app.schemas.user import UserCreate, UserResponse, UserDetailResponse
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    generate_password_reset_token,
    hash_reset_token,
)
from app.dependencies import get_current_user
from app.config import settings
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)

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

    avatar_url = user_in.avatar
    if not avatar_url or not avatar_url.strip():
        avatar_url = f"https://api.dicebear.com/8.x/adventurer/svg?seed={user_in.username}"

    # Hash the password and create user model
    hashed_password = get_password_hash(user_in.password)
    user = User(
        name=user_in.name,
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        bio=user_in.bio,
        avatar=avatar_url,
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


@router.get("/me", response_model=UserDetailResponse)
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


@router.post("/forgot-password")
def forgot_password(reset_req: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Request a password reset link.
    Guarantees account-enumeration protection by returning identical responses
    for both existing and nonexistent accounts.
    """
    generic_response = {
        "message": "If an account exists with this email, a password reset link has been sent."
    }

    # Normalize email using project standard
    normalized_email = reset_req.email.strip().lower()

    # Query user case-insensitively
    user = db.query(User).filter(func.lower(User.email) == normalized_email).first()

    if not user or not user.is_active:
        # Avoid obvious timing disparity with dummy password hash computation
        get_password_hash("timing_equalization_dummy_seed")
        return generic_response

    # Acquire row-level lock on the User record to serialize token issuance per user
    locked_user = (
        db.query(User)
        .filter(User.id == user.id)
        .with_for_update()
        .first()
    )
    if not locked_user or not locked_user.is_active:
        return generic_response

    # Rate limiting / abuse prevention: cooldown check per user under row lock
    now_utc = datetime.now(timezone.utc)
    cooldown_cutoff = now_utc - timedelta(seconds=settings.password_reset_cooldown_seconds)
    recent_token = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.user_id == locked_user.id,
            PasswordResetToken.created_at >= cooldown_cutoff,
        )
        .first()
    )
    if recent_token:
        # Cooldown active: do not generate another token or dispatch duplicate email.
        # Preserve enumeration protection by returning identical response.
        return generic_response

    # Invalidate any previously issued unused tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == locked_user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({"used_at": now_utc}, synchronize_session=False)

    # Generate cryptographically secure token and its SHA-256 hash
    raw_token, token_hash = generate_password_reset_token()
    expires_at = now_utc + timedelta(minutes=settings.password_reset_token_expire_minutes)

    token_record = PasswordResetToken(
        user_id=locked_user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        created_at=now_utc,
    )
    db.add(token_record)
    db.commit()
    db.refresh(token_record)

    # Send transactional email (row lock was released by commit above, preventing SMTP latency from stalling DB)
    email_delivered = EmailService.send_password_reset_email(
        to_email=locked_user.email,
        raw_token=raw_token,
    )

    if not email_delivered:
        logger.error("Password reset email delivery failed for user_id=%s", locked_user.id)
        # Prevent unsafe orphaned reset state: remove newly created token.
        # If email delivery does not complete successfully from the application's perspective,
        # the reset token is removed. A rare external-mail-server/network edge case could result
        # in an email being accepted externally even though the application treats delivery as failed;
        # that token will then be invalid.
        try:
            db.delete(token_record)
            db.commit()
        except Exception as del_err:
            db.rollback()
            logger.error(
                "Failed to cleanup un-delivered reset token for user_id=%s: %s",
                locked_user.id,
                type(del_err).__name__,
            )

    # Opportunistic cleanup: delete tokens expired more than 7 days ago for this user
    cleanup_cutoff = now_utc - timedelta(days=7)
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == locked_user.id,
        PasswordResetToken.expires_at < cleanup_cutoff,
    ).delete(synchronize_session=False)
    db.commit()

    return generic_response


@router.post("/reset-password")
def reset_password(confirm_data: PasswordResetConfirm, db: Session = Depends(get_db)):
    """
    Reset account password using single-use secure reset token.
    Atomically consumes token, invalidates outstanding tokens, and updates password.
    """
    raw_token = confirm_data.token.strip()
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    token_hash = hash_reset_token(raw_token)
    now_utc = datetime.now(timezone.utc)

    # Query token by SHA-256 hash
    token_record = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == token_hash)
        .first()
    )

    if (
        not token_record
        or token_record.used_at is not None
        or token_record.expires_at <= now_utc
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    # Verify associated user
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    # Atomically update password and consume token
    try:
        user.hashed_password = get_password_hash(confirm_data.new_password)
        token_record.used_at = now_utc

        # Invalidate any other active tokens for this user
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        ).update({"used_at": now_utc}, synchronize_session=False)

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error("Error during password reset transaction: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while resetting password. Please try again.",
        )

    return {
        "message": "Password has been reset successfully. You can now log in with your new password."
    }

