# app/api/v1/builders.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.user import User, Skill, UserSkill, AvailabilityStatus
from app.schemas.user import UserDetailResponse, UserResponse, UserUpdate, AddUserSkillRequest, UserSkillResponse, OnboardingRequest
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


@router.get("/me/skills", response_model=list[UserSkillResponse])
def get_my_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all skills for the currently authenticated builder."""
    return db.query(UserSkill).options(joinedload(UserSkill.skill)).filter(
        UserSkill.user_id == current_user.id
    ).all()


@router.post("/me/skills", response_model=UserSkillResponse, status_code=status.HTTP_201_CREATED)
def add_my_skill(
    skill_in: AddUserSkillRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new skill (standard or custom) to the authenticated builder's profile."""
    if not skill_in.skill_id and (not skill_in.skill_name or not skill_in.skill_name.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either a valid skill_id or a non-empty skill_name must be provided."
        )

    skill = None
    if skill_in.skill_id:
        skill = db.query(Skill).filter(Skill.id == skill_in.skill_id).first()
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Skill with ID {skill_in.skill_id} not found."
            )
    else:
        cleaned_name = skill_in.skill_name.strip()
        skill = db.query(Skill).filter(Skill.name.ilike(cleaned_name)).first()
        if not skill:
            category = skill_in.category.strip() if skill_in.category and skill_in.category.strip() else "Technical"
            valid_categories = {"Technical", "Design", "Product", "Communication", "Hackathon"}
            if category.title() in valid_categories:
                category = category.title()
            else:
                category = "Technical"

            skill = Skill(name=cleaned_name, category=category)
            db.add(skill)
            db.commit()
            db.refresh(skill)

    existing_user_skill = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.skill_id == skill.id
    ).first()
    if existing_user_skill:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Skill '{skill.name}' is already added to your profile."
        )

    user_skill = UserSkill(
        user_id=current_user.id,
        skill_id=skill.id,
        proficiency=skill_in.proficiency.strip() if skill_in.proficiency else "intermediate",
        is_verified=False
    )
    db.add(user_skill)
    db.commit()
    db.refresh(user_skill)

    return db.query(UserSkill).options(joinedload(UserSkill.skill)).filter(UserSkill.id == user_skill.id).first()


@router.delete("/me/skills/{skill_id}", status_code=status.HTTP_200_OK)
def delete_my_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a skill from the authenticated builder's profile."""
    user_skill = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.skill_id == skill_id
    ).first()

    if not user_skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill mapping not found on your profile."
        )

    db.delete(user_skill)
    db.commit()
    return {"message": "Skill removed successfully."}


@router.post("/me/onboarding", response_model=UserDetailResponse)
def complete_onboarding(
    data: OnboardingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save onboarding profile details and skills for the authenticated builder."""
    if data.college is not None:
        current_user.college = data.college
    if data.university is not None:
        current_user.university = data.university
    if data.year is not None:
        current_user.year = data.year
    if data.branch is not None:
        current_user.branch = data.branch
    if data.status is not None:
        current_user.status = data.status
    if data.github is not None:
        current_user.github = data.github
    if data.linkedin is not None:
        current_user.linkedin = data.linkedin
    if data.website is not None:
        current_user.website = data.website
        
    current_user.onboarding_completed = data.onboarding_completed

    # Set default avatar if not already set or starts with default placeholder
    if not current_user.avatar or "dicebear.com" not in current_user.avatar:
        current_user.avatar = f"https://api.dicebear.com/8.x/adventurer/svg?seed={current_user.username}"

    # Clear current skills and bulk-insert new skills
    db.query(UserSkill).filter(UserSkill.user_id == current_user.id).delete()
    for skill_name in data.skills:
        if not skill_name.strip():
            continue
        cleaned_name = skill_name.strip()
        # Find or create skill
        skill = db.query(Skill).filter(Skill.name.ilike(cleaned_name)).first()
        if not skill:
            skill = Skill(name=cleaned_name, category="Technical")
            db.add(skill)
            db.commit()
            db.refresh(skill)
            
        user_skill = UserSkill(
            user_id=current_user.id,
            skill_id=skill.id,
            proficiency="intermediate",
            is_verified=False
        )
        db.add(user_skill)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

