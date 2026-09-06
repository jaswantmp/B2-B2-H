# app/api/v1/admin.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, and_, func, String
from sqlalchemy.orm import Session, joinedload, selectinload
from app.database import get_db
from app.dependencies import get_current_admin
from app.models.user import User, Skill, UserSkill, AvailabilityStatus
from app.models.project import Project, ProjectMember, ProjectApplication
from app.models.team import Team, TeamMember, TeamInvite
from app.models.hackathon import Hackathon, HackathonRegistration
from app.services.team_health_service import TeamHealthService
from app.schemas.admin import (
    AdminStatsResponse,
    AdminStudentSummary,
    AdminStudentListResponse,
    AdminStudentDetailResponse,
    AdminStudentStatusUpdate,
    AdminStudentVerificationUpdate,
    AdminStudentSkillItem,
    AdminStudentProjectItem,
    AdminStudentTeamItem,
    AdminStudentHackathonItem,
    AdminHackathonSummary,
    AdminHackathonListResponse,
    AdminHackathonCreate,
    AdminHackathonUpdate,
    AdminHackathonRegistrationItem,
    AdminHackathonDetailResponse,
    AdminProjectCreator,
    AdminProjectSummary,
    AdminProjectListResponse,
    AdminProjectMemberItem,
    AdminProjectApplicationItem,
    AdminProjectDetailResponse,
    AdminProjectUpdate,
    AdminTeamLeader,
    AdminTeamSummary,
    AdminTeamListResponse,
    AdminTeamMemberItem,
    AdminTeamInviteItem,
    AdminTeamDetailResponse,
    AdminTeamUpdate,
)

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_admin)],
)


# ─── System Statistics ────────────────────────────────────────────────────────
@router.get("/stats", response_model=AdminStatsResponse, status_code=status.HTTP_200_OK)
def get_admin_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Retrieve live database-backed administrative system metrics.
    Strictly protected: requires admin privileges.
    """
    total_students = db.query(User).count()
    active_students = db.query(User).filter(User.is_active == True).count()
    verified_students = db.query(User).filter(User.is_verified == True).count()
    total_projects = db.query(Project).count()
    total_teams = db.query(Team).count()
    total_hackathons = db.query(Hackathon).count()
    total_hackathon_registrations = db.query(HackathonRegistration).count()

    return AdminStatsResponse(
        total_students=total_students,
        active_students=active_students,
        verified_students=verified_students,
        total_projects=total_projects,
        total_teams=total_teams,
        total_hackathons=total_hackathons,
        total_hackathon_registrations=total_hackathon_registrations,
    )


# ─── Student Management: List & Filter ────────────────────────────────────────
@router.get("/students", response_model=AdminStudentListResponse, status_code=status.HTTP_200_OK)
def list_students(
    search: str = Query("", description="Search term for name, username, or email"),
    status_filter: AvailabilityStatus | None = Query(None, alias="status", description="Filter by availability status"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    is_verified: bool | None = Query(None, description="Filter by verification status"),
    college: str | None = Query(None, description="Filter by college"),
    branch: str | None = Query(None, description="Filter by academic branch"),
    year: str | None = Query(None, description="Filter by academic year"),
    page: int = Query(1, ge=1, description="Page number starting at 1"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    List students with database-level pagination, sorting, and multi-criteria filtering.
    Does not expose sensitive authentication information or hashed passwords.
    """
    query = db.query(User).options(selectinload(User.user_skills))

    # 1. Text Search across name, username, email
    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.name.ilike(search_pattern),
                User.username.ilike(search_pattern),
                User.email.ilike(search_pattern),
            )
        )

    # 2. Availability Status Filter
    if status_filter is not None:
        query = query.filter(User.status == status_filter)

    # 3. Account Active Status Filter
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    # 4. Verification Status Filter
    if is_verified is not None:
        query = query.filter(User.is_verified == is_verified)

    # 5. College Filter
    if college and college.strip():
        query = query.filter(
            or_(
                User.college.ilike(f"%{college.strip()}%"),
                User.university.ilike(f"%{college.strip()}%"),
            )
        )

    # 6. Branch Filter
    if branch and branch.strip():
        query = query.filter(User.branch.ilike(f"%{branch.strip()}%"))

    # 7. Academic Year Filter
    if year and year.strip():
        query = query.filter(User.year == year.strip())

    # Total Count for deterministic pagination
    total = query.count()
    total_pages = (total + limit - 1) // limit if total > 0 else 1

    # Deterministic order: newest joined first, tiebreak on id
    query = query.order_by(User.joined_at.desc(), User.id.desc())

    # Database-level limit and offset
    offset = (page - 1) * limit
    users = query.offset(offset).limit(limit).all()

    items = [
        AdminStudentSummary(
            id=u.id,
            name=u.name,
            username=u.username,
            email=u.email,
            avatar=u.avatar,
            college=u.college,
            university=u.university,
            branch=u.branch,
            year=u.year,
            status=u.status,
            is_active=u.is_active,
            is_verified=u.is_verified,
            is_admin=u.is_admin,
            onboarding_completed=u.onboarding_completed,
            hackathons_won=u.hackathons_won,
            skills_count=len(u.user_skills),
            joined_at=u.joined_at,
            updated_at=u.updated_at,
        )
        for u in users
    ]

    return AdminStudentListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


# ─── Student Management: Detailed View ────────────────────────────────────────
@router.get("/students/{student_id}", response_model=AdminStudentDetailResponse, status_code=status.HTTP_200_OK)
def get_student_detail(
    student_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Retrieve comprehensive student information including associated skills, projects,
    teams, and hackathon registrations.
    """
    user = (
        db.query(User)
        .options(
            joinedload(User.user_skills).joinedload(UserSkill.skill),
            joinedload(User.created_projects),
            joinedload(User.project_memberships).joinedload(ProjectMember.project),
            joinedload(User.led_teams),
            joinedload(User.team_memberships).joinedload(TeamMember.team),
        )
        .filter(User.id == student_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID '{student_id}' not found.",
        )

    # 1. Skills
    skills_list = [
        AdminStudentSkillItem(
            id=us.id,
            skill_id=us.skill_id,
            name=us.skill.name if us.skill else "Unknown",
            category=us.skill.category if us.skill else None,
            proficiency=us.proficiency,
            is_verified=us.is_verified,
        )
        for us in user.user_skills
        if us.skill
    ]

    # 2. Projects (de-duplicated across created and joined)
    projects_map = {}
    for p in user.created_projects:
        projects_map[p.id] = AdminStudentProjectItem(
            id=p.id,
            title=p.title,
            category=p.category,
            status=p.status,
            role="Creator",
            is_creator=True,
            created_at=p.created_at,
        )
    for pm in user.project_memberships:
        if pm.project and pm.project.id not in projects_map:
            projects_map[pm.project.id] = AdminStudentProjectItem(
                id=pm.project.id,
                title=pm.project.title,
                category=pm.project.category,
                status=pm.project.status,
                role=pm.role or "Member",
                is_creator=(pm.project.creator_id == user.id),
                created_at=pm.project.created_at,
            )

    # 3. Teams (de-duplicated across led and member)
    teams_map = {}
    for t in user.led_teams:
        teams_map[t.id] = AdminStudentTeamItem(
            id=t.id,
            name=t.name,
            hackathon_id=t.hackathon_id,
            status=t.status,
            role="Team Lead",
            is_leader=True,
            created_at=t.created_at,
        )
    for tm in user.team_memberships:
        if tm.team and tm.team.id not in teams_map:
            teams_map[tm.team.id] = AdminStudentTeamItem(
                id=tm.team.id,
                name=tm.team.name,
                hackathon_id=tm.team.hackathon_id,
                status=tm.team.status,
                role=tm.role or "Member",
                is_leader=(tm.team.leader_id == user.id),
                created_at=tm.team.created_at,
            )

    # 4. Hackathon registrations
    registrations = (
        db.query(HackathonRegistration)
        .options(joinedload(HackathonRegistration.hackathon))
        .filter(HackathonRegistration.user_id == user.id)
        .order_by(HackathonRegistration.registered_at.desc())
        .all()
    )
    hackathons_list = [
        AdminStudentHackathonItem(
            id=hr.hackathon.id,
            title=hr.hackathon.title,
            organizer=hr.hackathon.organizer,
            date=hr.hackathon.date,
            end_date=hr.hackathon.end_date,
            location=hr.hackathon.location,
            registered_at=hr.registered_at,
        )
        for hr in registrations
        if hr.hackathon
    ]

    return AdminStudentDetailResponse(
        id=user.id,
        name=user.name,
        username=user.username,
        email=user.email,
        bio=user.bio,
        avatar=user.avatar,
        location=user.location,
        university=user.university,
        college=user.college,
        district=user.district,
        city=user.city,
        state=user.state,
        year=user.year,
        branch=user.branch,
        github=user.github,
        linkedin=user.linkedin,
        twitter=user.twitter,
        website=user.website,
        domains=user.domains,
        status=user.status,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_admin=user.is_admin,
        onboarding_completed=user.onboarding_completed,
        hackathons_won=user.hackathons_won,
        profile_views=user.profile_views,
        joined_at=user.joined_at,
        updated_at=user.updated_at,
        skills=skills_list,
        projects=list(projects_map.values()),
        teams=list(teams_map.values()),
        hackathons=hackathons_list,
    )


# ─── Student Management: Account Status (Active/Inactive) ─────────────────────
@router.patch("/students/{student_id}/status", response_model=AdminStudentSummary, status_code=status.HTTP_200_OK)
def update_student_status(
    student_id: str,
    update_data: AdminStudentStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Activate or deactivate a student account.
    Deactivated students are blocked from authenticating or accessing protected APIs.
    """
    user = (
        db.query(User)
        .options(selectinload(User.user_skills))
        .filter(User.id == student_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID '{student_id}' not found.",
        )

    user.is_active = update_data.is_active
    db.commit()
    db.refresh(user)

    return AdminStudentSummary(
        id=user.id,
        name=user.name,
        username=user.username,
        email=user.email,
        avatar=user.avatar,
        college=user.college,
        university=user.university,
        branch=user.branch,
        year=user.year,
        status=user.status,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_admin=user.is_admin,
        onboarding_completed=user.onboarding_completed,
        hackathons_won=user.hackathons_won,
        skills_count=len(user.user_skills),
        joined_at=user.joined_at,
        updated_at=user.updated_at,
    )


# ─── Student Management: Verification Status ──────────────────────────────────
@router.patch("/students/{student_id}/verification", response_model=AdminStudentSummary, status_code=status.HTTP_200_OK)
def update_student_verification(
    student_id: str,
    update_data: AdminStudentVerificationUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Update a student's verification flag (e.g. verified student builder badge).
    """
    user = (
        db.query(User)
        .options(selectinload(User.user_skills))
        .filter(User.id == student_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID '{student_id}' not found.",
        )

    user.is_verified = update_data.is_verified
    db.commit()
    db.refresh(user)

    return AdminStudentSummary(
        id=user.id,
        name=user.name,
        username=user.username,
        email=user.email,
        avatar=user.avatar,
        college=user.college,
        university=user.university,
        branch=user.branch,
        year=user.year,
        status=user.status,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_admin=user.is_admin,
        onboarding_completed=user.onboarding_completed,
        hackathons_won=user.hackathons_won,
        skills_count=len(user.user_skills),
        joined_at=user.joined_at,
        updated_at=user.updated_at,
    )


# ─── Hackathon Management: List & Filter ──────────────────────────────────────
@router.get("/hackathons", response_model=AdminHackathonListResponse, status_code=status.HTTP_200_OK)
def list_hackathons(
    search: str = Query("", description="Search by title, organizer, location, or description"),
    organizer: str | None = Query(None, description="Filter by organizer"),
    location: str | None = Query(None, description="Filter by location"),
    tag: str | None = Query(None, description="Filter by tag"),
    track: str | None = Query(None, description="Filter by track"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    List hackathons with database-level aggregation, search, filters, and pagination.
    """
    # Subquery for registration count aggregation
    reg_count_subq = (
        db.query(
            HackathonRegistration.hackathon_id.label("h_id"),
            func.count(HackathonRegistration.id).label("reg_count"),
        )
        .group_by(HackathonRegistration.hackathon_id)
        .subquery()
    )

    query = (
        db.query(
            Hackathon,
            func.coalesce(reg_count_subq.c.reg_count, 0).label("registration_count"),
        )
        .outerjoin(reg_count_subq, Hackathon.id == reg_count_subq.c.h_id)
    )

    if search and search.strip():
        sp = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Hackathon.title.ilike(sp),
                Hackathon.organizer.ilike(sp),
                Hackathon.location.ilike(sp),
                Hackathon.description.ilike(sp),
            )
        )

    if organizer and organizer.strip():
        query = query.filter(Hackathon.organizer.ilike(f"%{organizer.strip()}%"))

    if location and location.strip():
        query = query.filter(Hackathon.location.ilike(f"%{location.strip()}%"))

    if tag and tag.strip():
        query = query.filter(Hackathon.tags.cast(String).ilike(f"%{tag.strip()}%"))

    if track and track.strip():
        query = query.filter(Hackathon.tracks.cast(String).ilike(f"%{track.strip()}%"))

    total = query.count()
    total_pages = (total + limit - 1) // limit if total > 0 else 1

    offset = (page - 1) * limit
    results = (
        query
        .order_by(Hackathon.date.desc(), Hackathon.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = [
        AdminHackathonSummary(
            id=h.id,
            title=h.title,
            organizer=h.organizer,
            date=h.date,
            end_date=h.end_date,
            location=h.location,
            prize=h.prize,
            team_size=h.team_size,
            description=h.description,
            tracks=h.tracks or [],
            tags=h.tags or [],
            registration_count=int(rc),
            created_at=h.created_at,
            updated_at=h.updated_at,
        )
        for h, rc in results
    ]

    return AdminHackathonListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


# ─── Hackathon Management: Detail View ────────────────────────────────────────
@router.get("/hackathons/{hackathon_id}", response_model=AdminHackathonDetailResponse, status_code=status.HTTP_200_OK)
def get_hackathon_detail(
    hackathon_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Retrieve comprehensive hackathon details including registered students.
    """
    hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hackathon with ID {hackathon_id} not found.",
        )

    registrations = (
        db.query(HackathonRegistration)
        .options(joinedload(HackathonRegistration.user))
        .filter(HackathonRegistration.hackathon_id == hackathon_id)
        .order_by(HackathonRegistration.registered_at.desc())
        .all()
    )

    reg_items = [
        AdminHackathonRegistrationItem(
            id=r.id,
            student_id=r.user_id,
            student_name=r.user.name if r.user else "Unknown Student",
            student_email=r.user.email if r.user else "unknown@domain.com",
            college=r.user.college if r.user else None,
            branch=r.user.branch if r.user else None,
            year=r.user.year if r.user else None,
            registered_at=r.registered_at,
        )
        for r in registrations
        if r.user
    ]

    return AdminHackathonDetailResponse(
        id=hackathon.id,
        title=hackathon.title,
        organizer=hackathon.organizer,
        date=hackathon.date,
        end_date=hackathon.end_date,
        location=hackathon.location,
        prize=hackathon.prize,
        team_size=hackathon.team_size,
        description=hackathon.description,
        tracks=hackathon.tracks or [],
        tags=hackathon.tags or [],
        registration_count=len(registrations),
        created_at=hackathon.created_at,
        updated_at=hackathon.updated_at,
        registrations=reg_items,
    )


# ─── Hackathon Management: Create Hackathon ───────────────────────────────────
@router.post("/hackathons", response_model=AdminHackathonDetailResponse, status_code=status.HTTP_201_CREATED)
def create_hackathon(
    hackathon_in: AdminHackathonCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Create a new hackathon event. Fully validated to remain compatible with ML recommender pipelines.
    """
    if hackathon_in.end_date < hackathon_in.date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date cannot be earlier than start date.",
        )

    clean_tracks = [t.strip() for t in hackathon_in.tracks if t and t.strip()]
    clean_tags = [t.strip() for t in hackathon_in.tags if t and t.strip()]

    hackathon = Hackathon(
        title=hackathon_in.title.strip(),
        organizer=hackathon_in.organizer.strip(),
        date=hackathon_in.date,
        end_date=hackathon_in.end_date,
        location=hackathon_in.location.strip(),
        prize=hackathon_in.prize.strip(),
        team_size=hackathon_in.team_size.strip(),
        description=hackathon_in.description.strip(),
        tracks=clean_tracks,
        tags=clean_tags,
    )
    db.add(hackathon)
    db.commit()
    db.refresh(hackathon)

    return AdminHackathonDetailResponse(
        id=hackathon.id,
        title=hackathon.title,
        organizer=hackathon.organizer,
        date=hackathon.date,
        end_date=hackathon.end_date,
        location=hackathon.location,
        prize=hackathon.prize,
        team_size=hackathon.team_size,
        description=hackathon.description,
        tracks=hackathon.tracks or [],
        tags=hackathon.tags or [],
        registration_count=0,
        created_at=hackathon.created_at,
        updated_at=hackathon.updated_at,
        registrations=[],
    )


# ─── Hackathon Management: Update Hackathon ───────────────────────────────────
@router.patch("/hackathons/{hackathon_id}", response_model=AdminHackathonDetailResponse, status_code=status.HTTP_200_OK)
def update_hackathon(
    hackathon_id: int,
    hackathon_in: AdminHackathonUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Update an existing hackathon's details.
    """
    hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hackathon with ID {hackathon_id} not found.",
        )

    new_date = hackathon_in.date or hackathon.date
    new_end_date = hackathon_in.end_date or hackathon.end_date
    if new_end_date < new_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date cannot be earlier than start date.",
        )

    if hackathon_in.title is not None:
        hackathon.title = hackathon_in.title.strip()
    if hackathon_in.organizer is not None:
        hackathon.organizer = hackathon_in.organizer.strip()
    if hackathon_in.date is not None:
        hackathon.date = hackathon_in.date
    if hackathon_in.end_date is not None:
        hackathon.end_date = hackathon_in.end_date
    if hackathon_in.location is not None:
        hackathon.location = hackathon_in.location.strip()
    if hackathon_in.prize is not None:
        hackathon.prize = hackathon_in.prize.strip()
    if hackathon_in.team_size is not None:
        hackathon.team_size = hackathon_in.team_size.strip()
    if hackathon_in.description is not None:
        hackathon.description = hackathon_in.description.strip()
    if hackathon_in.tracks is not None:
        hackathon.tracks = [t.strip() for t in hackathon_in.tracks if t and t.strip()]
    if hackathon_in.tags is not None:
        hackathon.tags = [t.strip() for t in hackathon_in.tags if t and t.strip()]

    db.commit()
    db.refresh(hackathon)

    registrations = (
        db.query(HackathonRegistration)
        .options(joinedload(HackathonRegistration.user))
        .filter(HackathonRegistration.hackathon_id == hackathon_id)
        .order_by(HackathonRegistration.registered_at.desc())
        .all()
    )
    reg_items = [
        AdminHackathonRegistrationItem(
            id=r.id,
            student_id=r.user_id,
            student_name=r.user.name if r.user else "Unknown Student",
            student_email=r.user.email if r.user else "unknown@domain.com",
            college=r.user.college if r.user else None,
            branch=r.user.branch if r.user else None,
            year=r.user.year if r.user else None,
            registered_at=r.registered_at,
        )
        for r in registrations
        if r.user
    ]

    return AdminHackathonDetailResponse(
        id=hackathon.id,
        title=hackathon.title,
        organizer=hackathon.organizer,
        date=hackathon.date,
        end_date=hackathon.end_date,
        location=hackathon.location,
        prize=hackathon.prize,
        team_size=hackathon.team_size,
        description=hackathon.description,
        tracks=hackathon.tracks or [],
        tags=hackathon.tags or [],
        registration_count=len(registrations),
        created_at=hackathon.created_at,
        updated_at=hackathon.updated_at,
        registrations=reg_items,
    )


# ─── Hackathon Management: Registrations Inspection ───────────────────────────
@router.get("/hackathons/{hackathon_id}/registrations", response_model=list[AdminHackathonRegistrationItem], status_code=status.HTTP_200_OK)
def get_hackathon_registrations(
    hackathon_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Inspect student registrations for a specific hackathon event.
    """
    hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hackathon with ID {hackathon_id} not found.",
        )

    registrations = (
        db.query(HackathonRegistration)
        .options(joinedload(HackathonRegistration.user))
        .filter(HackathonRegistration.hackathon_id == hackathon_id)
        .order_by(HackathonRegistration.registered_at.desc())
        .all()
    )

    return [
        AdminHackathonRegistrationItem(
            id=r.id,
            student_id=r.user_id,
            student_name=r.user.name if r.user else "Unknown Student",
            student_email=r.user.email if r.user else "unknown@domain.com",
            college=r.user.college if r.user else None,
            branch=r.user.branch if r.user else None,
            year=r.user.year if r.user else None,
            registered_at=r.registered_at,
        )
        for r in registrations
        if r.user
    ]


# ─── Hackathon Management: Safe Deletion ──────────────────────────────────────
@router.delete("/hackathons/{hackathon_id}", status_code=status.HTTP_200_OK)
def delete_hackathon(
    hackathon_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Safely delete a hackathon.
    Prevents accidental loss of student registrations (returns 409 Conflict if registrations exist).
    Prevents breaking team associations (returns 409 Conflict if teams are linked).
    """
    hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hackathon with ID {hackathon_id} not found.",
        )

    reg_count = (
        db.query(HackathonRegistration)
        .filter(HackathonRegistration.hackathon_id == hackathon_id)
        .count()
    )
    if reg_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete hackathon: {reg_count} student registration(s) exist. Deleting this hackathon would destroy student registration history.",
        )

    team_count = (
        db.query(Team)
        .filter(Team.hackathon_id == hackathon_id)
        .count()
    )
    if team_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete hackathon: {team_count} team(s) are currently associated with this hackathon.",
        )

    db.delete(hackathon)
    db.commit()

    return {
        "success": True,
        "message": f"Hackathon '{hackathon.title}' successfully deleted."
    }


# ─── Project Management: List with Pagination & SQL Aggregation ───────────────
@router.get("/projects", response_model=AdminProjectListResponse, status_code=status.HTTP_200_OK)
def list_admin_projects(
    search: str | None = Query(default=None, description="Search by title, description, or university"),
    category: str | None = Query(default=None, description="Filter by category (college, research, opensource, startup)"),
    project_status: str | None = Query(default=None, alias="status", description="Filter by status (recruiting, active, completed)"),
    tech: str | None = Query(default=None, description="Filter by technology tag"),
    creator_id: str | None = Query(default=None, description="Filter by project creator ID"),
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=15, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Retrieve paginated list of projects with SQL-aggregated member and application counts.
    Strictly protected: requires admin privileges.
    """
    member_count_subq = (
        db.query(func.count(ProjectMember.id))
        .filter(ProjectMember.project_id == Project.id)
        .correlate(Project)
        .scalar_subquery()
    )

    app_count_subq = (
        db.query(func.count(ProjectApplication.id))
        .filter(ProjectApplication.project_id == Project.id)
        .correlate(Project)
        .scalar_subquery()
    )

    base_query = db.query(Project, member_count_subq, app_count_subq).options(
        joinedload(Project.creator)
    )

    if search and search.strip():
        term = f"%{search.strip()}%"
        base_query = base_query.filter(
            or_(
                Project.title.ilike(term),
                Project.description.ilike(term),
                Project.university.ilike(term),
            )
        )

    if category and category.strip():
        base_query = base_query.filter(Project.category == category.strip().lower())

    if project_status and project_status.strip():
        base_query = base_query.filter(Project.status == project_status.strip().lower())

    if creator_id and creator_id.strip():
        base_query = base_query.filter(Project.creator_id == creator_id.strip())

    total = base_query.count()
    total_pages = max(1, (total + limit - 1) // limit)

    results = (
        base_query.order_by(Project.created_at.desc(), Project.id.asc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = []
    for proj, mc, ac in results:
        creator_info = AdminProjectCreator(
            id=proj.creator.id if proj.creator else proj.creator_id,
            name=proj.creator.name if proj.creator else "Unknown Creator",
            username=proj.creator.username if proj.creator else "unknown",
            email=proj.creator.email if proj.creator else "unknown@domain.com",
            avatar=proj.creator.avatar if proj.creator else None,
            college=proj.creator.college if proj.creator else None,
            university=proj.creator.university if proj.creator else None,
            branch=proj.creator.branch if proj.creator else None,
            year=proj.creator.year if proj.creator else None,
            is_active=proj.creator.is_active if proj.creator else True,
            is_verified=proj.creator.is_verified if proj.creator else False,
        )

        items.append(
            AdminProjectSummary(
                id=proj.id,
                title=proj.title,
                description=proj.description,
                category=proj.category,
                status=proj.status,
                deadline=proj.deadline,
                university=proj.university,
                tech=proj.tech or [],
                open_roles=proj.open_roles or [],
                member_count=int(mc or 0),
                application_count=int(ac or 0),
                creator=creator_info,
                created_at=proj.created_at,
                updated_at=proj.updated_at,
            )
        )

    return AdminProjectListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


# ─── Project Management: Detail View ──────────────────────────────────────────
@router.get("/projects/{project_id}", response_model=AdminProjectDetailResponse, status_code=status.HTTP_200_OK)
def get_admin_project_detail(
    project_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Retrieve comprehensive project details including creator profile, full members list, and applications.
    """
    project = (
        db.query(Project)
        .options(joinedload(Project.creator))
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found.",
        )

    creator_info = AdminProjectCreator(
        id=project.creator.id if project.creator else project.creator_id,
        name=project.creator.name if project.creator else "Unknown Creator",
        username=project.creator.username if project.creator else "unknown",
        email=project.creator.email if project.creator else "unknown@domain.com",
        avatar=project.creator.avatar if project.creator else None,
        college=project.creator.college if project.creator else None,
        university=project.creator.university if project.creator else None,
        branch=project.creator.branch if project.creator else None,
        year=project.creator.year if project.creator else None,
        is_active=project.creator.is_active if project.creator else True,
        is_verified=project.creator.is_verified if project.creator else False,
    )

    # Fetch members with joined user info
    members_raw = (
        db.query(ProjectMember)
        .options(joinedload(ProjectMember.user))
        .filter(ProjectMember.project_id == project_id)
        .order_by(ProjectMember.joined_at.asc())
        .all()
    )
    member_items = [
        AdminProjectMemberItem(
            id=m.id,
            student_id=m.user_id,
            name=m.user.name if m.user else "Unknown Student",
            username=m.user.username if m.user else "unknown",
            email=m.user.email if m.user else "unknown@domain.com",
            avatar=m.user.avatar if m.user else None,
            college=m.user.college if m.user else None,
            branch=m.user.branch if m.user else None,
            year=m.user.year if m.user else None,
            role=m.role,
            joined_at=m.joined_at,
        )
        for m in members_raw
        if m.user
    ]

    # Fetch applications with applicant user info
    apps_raw = (
        db.query(ProjectApplication)
        .options(joinedload(ProjectApplication.user))
        .filter(ProjectApplication.project_id == project_id)
        .order_by(ProjectApplication.created_at.desc())
        .all()
    )
    app_items = [
        AdminProjectApplicationItem(
            id=a.id,
            project_id=a.project_id,
            student_id=a.user_id,
            name=a.user.name if a.user else "Unknown Student",
            username=a.user.username if a.user else "unknown",
            email=a.user.email if a.user else "unknown@domain.com",
            avatar=a.user.avatar if a.user else None,
            college=a.user.college if a.user else None,
            branch=a.user.branch if a.user else None,
            year=a.user.year if a.user else None,
            status=a.status,
            created_at=a.created_at,
            updated_at=a.updated_at,
        )
        for a in apps_raw
        if a.user
    ]

    return AdminProjectDetailResponse(
        id=project.id,
        title=project.title,
        description=project.description,
        category=project.category,
        status=project.status,
        deadline=project.deadline,
        university=project.university,
        tech=project.tech or [],
        open_roles=project.open_roles or [],
        member_count=len(members_raw),
        application_count=len(apps_raw),
        creator=creator_info,
        created_at=project.created_at,
        updated_at=project.updated_at,
        members=member_items,
        applications=app_items,
    )


# ─── Project Management: Moderation / Update ─────────────────────────────────
@router.patch("/projects/{project_id}", response_model=AdminProjectDetailResponse, status_code=status.HTTP_200_OK)
def update_admin_project(
    project_id: str,
    project_in: AdminProjectUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Moderation endpoint for projects.
    Strictly isolated: allows updating only Project moderation fields (title, description, category,
    status, deadline, university, tech, open_roles).
    Never modifies creator_id, ProjectMember, ProjectApplication, or User records.
    """
    project = (
        db.query(Project)
        .options(joinedload(Project.creator))
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found.",
        )

    # Validate category against supported system categories
    if project_in.category is not None:
        valid_categories = {"college", "research", "opensource", "startup"}
        cleaned_cat = project_in.category.strip().lower()
        if cleaned_cat not in valid_categories:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid category '{project_in.category}'. Supported categories: {', '.join(sorted(valid_categories))}.",
            )
        project.category = cleaned_cat

    # Validate status against supported system statuses
    if project_in.status is not None:
        valid_statuses = {"recruiting", "active", "completed"}
        cleaned_status = project_in.status.strip().lower()
        if cleaned_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{project_in.status}'. Supported statuses: {', '.join(sorted(valid_statuses))}.",
            )
        project.status = cleaned_status

    if project_in.title is not None:
        project.title = project_in.title.strip()
    if project_in.description is not None:
        project.description = project_in.description.strip()
    if project_in.university is not None:
        project.university = project_in.university.strip() if project_in.university else None
    if project_in.deadline is not None:
        project.deadline = project_in.deadline
    if project_in.tech is not None:
        project.tech = [t.strip() for t in project_in.tech if t and t.strip()]
    if project_in.open_roles is not None:
        project.open_roles = [r.strip() for r in project_in.open_roles if r and r.strip()]

    db.commit()
    db.refresh(project)

    # Fetch updated members and applications to construct response
    members_raw = (
        db.query(ProjectMember)
        .options(joinedload(ProjectMember.user))
        .filter(ProjectMember.project_id == project_id)
        .order_by(ProjectMember.joined_at.asc())
        .all()
    )
    member_items = [
        AdminProjectMemberItem(
            id=m.id,
            student_id=m.user_id,
            name=m.user.name if m.user else "Unknown Student",
            username=m.user.username if m.user else "unknown",
            email=m.user.email if m.user else "unknown@domain.com",
            avatar=m.user.avatar if m.user else None,
            college=m.user.college if m.user else None,
            branch=m.user.branch if m.user else None,
            year=m.user.year if m.user else None,
            role=m.role,
            joined_at=m.joined_at,
        )
        for m in members_raw
        if m.user
    ]

    apps_raw = (
        db.query(ProjectApplication)
        .options(joinedload(ProjectApplication.user))
        .filter(ProjectApplication.project_id == project_id)
        .order_by(ProjectApplication.created_at.desc())
        .all()
    )
    app_items = [
        AdminProjectApplicationItem(
            id=a.id,
            project_id=a.project_id,
            student_id=a.user_id,
            name=a.user.name if a.user else "Unknown Student",
            username=a.user.username if a.user else "unknown",
            email=a.user.email if a.user else "unknown@domain.com",
            avatar=a.user.avatar if a.user else None,
            college=a.user.college if a.user else None,
            branch=a.user.branch if a.user else None,
            year=a.user.year if a.user else None,
            status=a.status,
            created_at=a.created_at,
            updated_at=a.updated_at,
        )
        for a in apps_raw
        if a.user
    ]

    creator_info = AdminProjectCreator(
        id=project.creator.id if project.creator else project.creator_id,
        name=project.creator.name if project.creator else "Unknown Creator",
        username=project.creator.username if project.creator else "unknown",
        email=project.creator.email if project.creator else "unknown@domain.com",
        avatar=project.creator.avatar if project.creator else None,
        college=project.creator.college if project.creator else None,
        university=project.creator.university if project.creator else None,
        branch=project.creator.branch if project.creator else None,
        year=project.creator.year if project.creator else None,
        is_active=project.creator.is_active if project.creator else True,
        is_verified=project.creator.is_verified if project.creator else False,
    )

    return AdminProjectDetailResponse(
        id=project.id,
        title=project.title,
        description=project.description,
        category=project.category,
        status=project.status,
        deadline=project.deadline,
        university=project.university,
        tech=project.tech or [],
        open_roles=project.open_roles or [],
        member_count=len(members_raw),
        application_count=len(apps_raw),
        creator=creator_info,
        created_at=project.created_at,
        updated_at=project.updated_at,
        members=member_items,
        applications=app_items,
    )


# ─── Project Management: Applications Inspection ─────────────────────────────
@router.get("/projects/{project_id}/applications", response_model=list[AdminProjectApplicationItem], status_code=status.HTTP_200_OK)
def get_admin_project_applications(
    project_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Inspect student collaboration applications for a project.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found.",
        )

    apps_raw = (
        db.query(ProjectApplication)
        .options(joinedload(ProjectApplication.user))
        .filter(ProjectApplication.project_id == project_id)
        .order_by(ProjectApplication.created_at.desc())
        .all()
    )

    return [
        AdminProjectApplicationItem(
            id=a.id,
            project_id=a.project_id,
            student_id=a.user_id,
            name=a.user.name if a.user else "Unknown Student",
            username=a.user.username if a.user else "unknown",
            email=a.user.email if a.user else "unknown@domain.com",
            avatar=a.user.avatar if a.user else None,
            college=a.user.college if a.user else None,
            branch=a.user.branch if a.user else None,
            year=a.user.year if a.user else None,
            status=a.status,
            created_at=a.created_at,
            updated_at=a.updated_at,
        )
        for a in apps_raw
        if a.user
    ]


# ─── Project Management: Safe Deletion ────────────────────────────────────────
@router.delete("/projects/{project_id}", status_code=status.HTTP_200_OK)
def delete_admin_project(
    project_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Safely delete a project.
    Prevents accidental loss of student collaboration history:
    - Rejects with 409 Conflict if any student applications exist.
    - Rejects with 409 Conflict if actual non-creator collaborators exist.
    Never cascade-deletes applications, collaborators, or user accounts.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found.",
        )

    app_count = (
        db.query(ProjectApplication)
        .filter(ProjectApplication.project_id == project_id)
        .count()
    )
    if app_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete project: {app_count} application(s) exist for this project. Deleting this project would destroy student application history.",
        )

    # Check actual non-creator collaborators count (not relying on assumed creator membership row)
    non_creator_count = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id != project.creator_id,
        )
        .count()
    )
    if non_creator_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete project: {non_creator_count} collaborator member(s) exist. Deleting this project would destroy collaborator membership records.",
        )

    # Safe to delete: only creator (if row exists) and 0 applications
    db.delete(project)
    db.commit()

    return {
        "success": True,
        "message": f"Project '{project.title}' successfully deleted."
    }


# ─── Team Management: List & Filter ───────────────────────────────────────────
@router.get("/teams", response_model=AdminTeamListResponse, status_code=status.HTTP_200_OK)
def list_admin_teams(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    search: str | None = Query(None, description="Search team name or description"),
    status_filter: str | None = Query(None, alias="status", description="Filter by status (recruiting, active, full)"),
    hackathon_id: int | None = Query(None, description="Filter by hackathon ID"),
    leader_id: str | None = Query(None, description="Filter by leader ID"),
):
    """
    Paginated list of all teams with member count, invite count, and leader details.
    Allows searching and filtering by status or hackathon.
    """
    member_count_subq = (
        db.query(func.count(TeamMember.id))
        .filter(TeamMember.team_id == Team.id)
        .correlate(Team)
        .scalar_subquery()
    )
    invite_count_subq = (
        db.query(func.count(TeamInvite.id))
        .filter(TeamInvite.team_id == Team.id)
        .correlate(Team)
        .scalar_subquery()
    )

    query = (
        db.query(Team, member_count_subq.label("member_count"), invite_count_subq.label("invite_count"))
        .options(joinedload(Team.leader))
    )

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(Team.name.ilike(s), Team.description.ilike(s)))

    if status_filter:
        query = query.filter(Team.status == status_filter.strip().lower())

    if hackathon_id is not None:
        query = query.filter(Team.hackathon_id == hackathon_id)

    if leader_id:
        query = query.filter(Team.leader_id == leader_id.strip())

    total = query.count()
    total_pages = max(1, (total + limit - 1) // limit)
    offset = (page - 1) * limit

    results = query.order_by(Team.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for team_row, m_count, i_count in results:
        leader_obj = team_row.leader
        items.append(
            AdminTeamSummary(
                id=team_row.id,
                name=team_row.name,
                description=team_row.description,
                hackathon_id=team_row.hackathon_id,
                status=team_row.status,
                max_members=team_row.max_members,
                member_count=m_count or 0,
                invite_count=i_count or 0,
                leader=AdminTeamLeader(
                    id=leader_obj.id,
                    name=leader_obj.name,
                    username=leader_obj.username,
                    email=leader_obj.email,
                    avatar=leader_obj.avatar,
                    college=leader_obj.college,
                    university=leader_obj.university,
                    branch=leader_obj.branch,
                    year=leader_obj.year,
                ),
                created_at=team_row.created_at,
                updated_at=team_row.updated_at,
            )
        )

    return AdminTeamListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


# ─── Team Management: Details ─────────────────────────────────────────────────
@router.get("/teams/{team_id}", response_model=AdminTeamDetailResponse, status_code=status.HTTP_200_OK)
def get_admin_team_detail(
    team_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Retrieve full details for a team:
    - Leader details
    - Full members list with roles and student profiles
    - Full invites list with statuses
    - Dynamic ML team health analysis (read-only)
    """
    team = (
        db.query(Team)
        .options(
            joinedload(Team.leader),
            joinedload(Team.members).joinedload(TeamMember.user),
            joinedload(Team.invites).joinedload(TeamInvite.user),
        )
        .filter(Team.id == team_id)
        .first()
    )
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with ID {team_id} not found.",
        )

    # Compute dynamic read-only ML team health
    try:
        health_info = TeamHealthService.get_full_team_health(team, db)
    except Exception:
        health_info = {}

    members = [
        AdminTeamMemberItem(
            id=m.id,
            student_id=m.user_id,
            name=m.user.name,
            username=m.user.username,
            email=m.user.email,
            avatar=m.user.avatar,
            college=m.user.college,
            branch=m.user.branch,
            year=m.user.year,
            role=m.role,
            joined_at=m.joined_at,
        )
        for m in team.members
        if m.user
    ]

    invites = [
        AdminTeamInviteItem(
            id=inv.id,
            team_id=inv.team_id,
            student_id=inv.user_id,
            name=inv.user.name,
            username=inv.user.username,
            email=inv.user.email,
            avatar=inv.user.avatar,
            college=inv.user.college,
            branch=inv.user.branch,
            year=inv.user.year,
            role=inv.role,
            message=inv.message,
            status=inv.status,
            created_at=inv.created_at,
            updated_at=inv.updated_at,
        )
        for inv in team.invites
        if inv.user
    ]

    return AdminTeamDetailResponse(
        id=team.id,
        name=team.name,
        description=team.description,
        hackathon_id=team.hackathon_id,
        status=team.status,
        max_members=team.max_members,
        member_count=len(members),
        invite_count=len(invites),
        leader=AdminTeamLeader(
            id=team.leader.id,
            name=team.leader.name,
            username=team.leader.username,
            email=team.leader.email,
            avatar=team.leader.avatar,
            college=team.leader.college,
            university=team.leader.university,
            branch=team.leader.branch,
            year=team.leader.year,
        ),
        created_at=team.created_at,
        updated_at=team.updated_at,
        members=members,
        invites=invites,
        health_scores=health_info.get("health_scores", {}),
        missing_roles=health_info.get("missing_roles", []),
        health_details=health_info.get("health_details", {}),
        health_score=health_info.get("health_score"),
        ml_health_score=health_info.get("ml_health_score"),
        health_status=health_info.get("health_status"),
        is_ml_powered=health_info.get("is_ml_powered", False),
        model_version=health_info.get("model_version"),
        explainability=health_info.get("explainability", {}),
    )


# ─── Team Management: Moderation / Update ─────────────────────────────────────
@router.patch("/teams/{team_id}", response_model=AdminTeamDetailResponse, status_code=status.HTTP_200_OK)
def update_admin_team(
    team_id: str,
    update_data: AdminTeamUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Moderates team attributes:
    - name, description, status (recruiting, active, full), max_members (2-10), hackathon_id.
    - Strictly validates max_members against current member count.
    - Strictly prevents modification of team id, leader_id, members, invites, or user records.
    """
    team = (
        db.query(Team)
        .options(
            joinedload(Team.leader),
            joinedload(Team.members).joinedload(TeamMember.user),
            joinedload(Team.invites).joinedload(TeamInvite.user),
        )
        .filter(Team.id == team_id)
        .first()
    )
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with ID {team_id} not found.",
        )

    valid_statuses = {"recruiting", "active", "full"}
    if update_data.status is not None:
        normalized_status = update_data.status.strip().lower()
        if normalized_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{update_data.status}'. Allowed statuses: {', '.join(sorted(valid_statuses))}",
            )
        team.status = normalized_status

    if update_data.max_members is not None:
        if update_data.max_members < 2 or update_data.max_members > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team size must be between 2 and 10.",
            )
        current_member_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
        if update_data.max_members < current_member_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Team size cannot be smaller than current number of members ({current_member_count}).",
            )
        team.max_members = update_data.max_members
        # Adjust status automatically if full
        if current_member_count >= team.max_members:
            team.status = "full"

    if update_data.name is not None:
        cleaned_name = update_data.name.strip()
        if not cleaned_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team name cannot be empty.",
            )
        team.name = cleaned_name

    if update_data.description is not None:
        team.description = update_data.description.strip() if update_data.description else None

    if update_data.hackathon_id is not None:
        team.hackathon_id = update_data.hackathon_id

    db.commit()
    db.refresh(team)

    # Return refreshed detail view
    return get_admin_team_detail(team_id=team.id, db=db, admin_user=admin_user)


# ─── Team Management: List Team Invites ───────────────────────────────────────
@router.get("/teams/{team_id}/invites", response_model=list[AdminTeamInviteItem], status_code=status.HTTP_200_OK)
def list_admin_team_invites(
    team_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    List all invitations sent by this team (pending, accepted, declined).
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with ID {team_id} not found.",
        )

    invites_raw = (
        db.query(TeamInvite)
        .options(joinedload(TeamInvite.user))
        .filter(TeamInvite.team_id == team_id)
        .order_by(TeamInvite.created_at.desc())
        .all()
    )

    return [
        AdminTeamInviteItem(
            id=inv.id,
            team_id=inv.team_id,
            student_id=inv.user_id,
            name=inv.user.name,
            username=inv.user.username,
            email=inv.user.email,
            avatar=inv.user.avatar,
            college=inv.user.college,
            branch=inv.user.branch,
            year=inv.user.year,
            role=inv.role,
            message=inv.message,
            status=inv.status,
            created_at=inv.created_at,
            updated_at=inv.updated_at,
        )
        for inv in invites_raw
        if inv.user
    ]


# ─── Team Management: Safe Deletion ───────────────────────────────────────────
@router.delete("/teams/{team_id}", status_code=status.HTTP_200_OK)
def delete_admin_team(
    team_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    """
    Safely delete a team.
    Prevents accidental loss of team memberships and invitation history:
    - Rejects with 409 Conflict if any invitations exist.
    - Rejects with 409 Conflict if actual non-leader collaborator members exist.
    Never cascade-deletes collaborator memberships, invitations, or user accounts.
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with ID {team_id} not found.",
        )

    # 1. Check invitations count
    invites_count = db.query(TeamInvite).filter(TeamInvite.team_id == team_id).count()
    if invites_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete team: {invites_count} invitation(s) exist for this team. Deleting this team would destroy invitation records.",
        )

    # 2. Check actual non-leader collaborator members (not relying on assumed leader row)
    non_leader_count = (
        db.query(TeamMember)
        .filter(
            TeamMember.team_id == team_id,
            TeamMember.user_id != team.leader_id,
        )
        .count()
    )
    if non_leader_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete team: {non_leader_count} collaborator member(s) belong to this team. Deleting this team would destroy collaborator membership records.",
        )

    # Safe to delete: only empty team with no collaborator members and no invites
    team_name = team.name
    db.delete(team)
    db.commit()

    return {
        "success": True,
        "message": f"Team '{team_name}' successfully deleted."
    }


