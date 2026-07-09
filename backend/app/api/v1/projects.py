# app/api/v1/projects.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.project import Project, ProjectMember
from app.schemas.project import ProjectCreate, ProjectDetailResponse, ProjectResponse, ProjectUpdate
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/", response_model=ProjectDetailResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new project workspace, assigning the current user as creator/leader."""
    project = Project(
        title=project_in.title,
        description=project_in.description,
        category=project_in.category,
        university=project_in.university,
        status=project_in.status,
        deadline=project_in.deadline,
        tech=project_in.tech,
        open_roles=project_in.open_roles,
        creator_id=current_user.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Automatically add creator as a member of the project
    member = ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role="Creator",
    )
    db.add(member)
    db.commit()
    db.refresh(project)

    # Fetch fully loaded project to include creator and members relations
    return (
        db.query(Project)
        .options(joinedload(Project.creator), joinedload(Project.members).joinedload(ProjectMember.user))
        .filter(Project.id == project.id)
        .first()
    )


@router.get("/", response_model=list[ProjectDetailResponse])
def list_projects(
    category: str = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all projects, optionally filtered by category."""
    query = db.query(Project).options(
        joinedload(Project.creator),
        joinedload(Project.members).joinedload(ProjectMember.user),
    )
    if category:
        query = query.filter(Project.category == category)
    return query.all()


@router.get("/{id}", response_model=ProjectDetailResponse)
def get_project(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get project details by project ID."""
    project = (
        db.query(Project)
        .options(
            joinedload(Project.creator),
            joinedload(Project.members).joinedload(ProjectMember.user),
        )
        .filter(Project.id == id)
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


@router.patch("/{id}", response_model=ProjectDetailResponse)
def update_project(
    id: str,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a project profile. Only project creators can update."""
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if project.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permissions to edit this project.",
        )

    update_data = project_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    db.add(project)
    db.commit()
    db.refresh(project)

    return (
        db.query(Project)
        .options(
            joinedload(Project.creator),
            joinedload(Project.members).joinedload(ProjectMember.user),
        )
        .filter(Project.id == id)
        .first()
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a project workspace. Only project creators can delete."""
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if project.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permissions to delete this project.",
        )

    db.delete(project)
    db.commit()
    return None
