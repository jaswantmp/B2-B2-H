# app/models/hackathon.py
from __future__ import annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.user import User
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Hackathon(Base):
    __tablename__ = "hackathons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    organizer: Mapped[str] = mapped_column(String(200), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    location: Mapped[str] = mapped_column(String(200), nullable=False)
    prize: Mapped[str] = mapped_column(String(100), nullable=False)
    team_size: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "2-5"
    description: Mapped[str] = mapped_column(String(1000), nullable=False)

    tracks: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    registrations: Mapped[list["HackathonRegistration"]] = relationship(
        "HackathonRegistration", back_populates="hackathon", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Hackathon {self.title}>"


class HackathonRegistration(Base):
    __tablename__ = "hackathon_registrations"
    __table_args__ = (UniqueConstraint("hackathon_id", "user_id", name="uq_hackathon_registration"),)

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    hackathon_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    registered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    hackathon: Mapped["Hackathon"] = relationship("Hackathon", back_populates="registrations")
    user: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return f"<HackathonRegistration hackathon={self.hackathon_id} user={self.user_id}>"
