# app/api/v1/builders.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.user import User, Skill, UserSkill, AvailabilityStatus
from app.schemas.user import UserDetailResponse, UserResponse, UserUpdate
from app.dependencies import get_current_user

router = APIRouter(prefix="/builders", tags=["builders"])


@router.get("/", response_model=list[UserDetailResponse])
def list_builders(
    search: str = "",
    skills: list[str] = Query(default=None),
    statuses: list[AvailabilityStatus] = Query(default=None),
    status_legacy: str = Query(default=None, alias="status"),
    colleges: list[str] = Query(default=None),
    cities: list[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List builders with advanced multi-parameter searching and filtering."""
    query = db.query(User).options(joinedload(User.user_skills).joinedload(UserSkill.skill)).filter(User.is_active == True)

    # 1. Search Query (Across multiple fields)
    if search:
        search_terms = f"%{search}%"
        query = query.filter(
            or_(
                User.name.ilike(search_terms),
                User.username.ilike(search_terms),
                User.bio.ilike(search_terms),
                User.university.ilike(search_terms),
                User.college.ilike(search_terms),
                User.city.ilike(search_terms),
                User.state.ilike(search_terms),
                User.branch.ilike(search_terms),
            )
        )

    # 2. Status Filters (Support legacy single-value and array formats)
    status_filters = []
    if statuses:
        status_filters.extend(statuses)
    if status_legacy:
        try:
            status_filters.append(AvailabilityStatus(status_legacy))
        except ValueError:
            pass  # Ignore invalid legacy status values

    if status_filters:
        query = query.filter(User.status.in_(status_filters))

    # 3. Skills Filter (Intersecting skill lists)
    if skills:
        # Join user skills and target skills tables, match where any skill name matches the list
        query = query.join(User.user_skills).join(UserSkill.skill).filter(
            Skill.name.in_(skills)
        )

    # 4. College Filter
    if colleges:
        college_filters = [User.college.ilike(f"%{c}%") for c in colleges]
        query = query.filter(or_(*college_filters))

    # 5. City Filter
    if cities:
        city_filters = [
            or_(User.city.ilike(f"%{c}%"), User.location.ilike(f"%{c}%"))
            for c in cities
        ]
        query = query.filter(or_(*city_filters))

    # Avoid duplicate rows from skills joins
    return query.distinct().all()


@router.get("/{id}", response_model=UserDetailResponse)
def get_builder(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve details for a specific builder by ID."""
    builder = db.query(User).options(
        joinedload(User.user_skills).joinedload(UserSkill.skill)
    ).filter(User.id == id, User.is_active == True).first()

    if not builder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Builder not found",
        )
    return builder


@router.patch("/me", response_model=UserDetailResponse)
def update_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update profile settings for the currently authenticated builder."""
    update_data = user_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
